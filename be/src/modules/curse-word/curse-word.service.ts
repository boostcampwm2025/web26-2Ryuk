import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurseWord } from './curse-word.entity';
import { SanitizeResult } from './dto/curse-word-response.dto';

@Injectable()
export class CurseWordService implements OnModuleInit {
  private readonly logger = new Logger(CurseWordService.name);
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY_MS = 2000;
  private retryCount = 0;
  private cachedWords: string[] = [];
  private cachedPatterns: RegExp[] = [];

  constructor(@InjectRepository(CurseWord) private readonly curseWordRepository: Repository<CurseWord>) {}

  /**
   * 모듈 초기화 시 MySQL에서 메모리로 비속어 목록 적재 -> 실패 시 최대 3회까지 지수 백오프로 재시도
   * 모듈 초기화 시 비속어 리스트를 메모리에 캐싱
   */
  async onModuleInit(): Promise<void> {
    await this.loadWithRetry(0);
  }

  /**
   * 메시지 내 비속어를 필터링하여 마스킹 처리
   * 중간에 특수문자나 숫자나 공백이 들어간 경우도 처리 (예: 바.보, 바 보, 바123보)
   * @param message 필터링할 메시지
   * @returns 필터링 결과
   */
  async sanitize(message: string): Promise<SanitizeResult> {
    if (!message) {
      return { sanitized: message, hasCurse: false };
    }
    // 캐시가 비어 있으면 갱신
    if (this.cachedWords.length === 0) {
      await this.refreshCache();
    }
    if (this.cachedWords.length === 0) {
      return { sanitized: message, hasCurse: false };
    }

    const original = message;

    // 메시지를 한 번 훑으며 한글용/영문용 정규화 문자열과 매핑을 각각 만듦
    const buildNormalized = (predicate: (ch: string) => boolean) => {
      const chars: string[] = [];
      const map: number[] = [];
      for (let i = 0; i < original.length; i++) {
        const ch = original[i];
        if (predicate(ch)) {
          chars.push(ch.toLowerCase());
          map.push(i);
        }
      }
      return { text: chars.join(''), map };
    };

    const normKorean = buildNormalized((ch) => /[가-힣]/.test(ch));
    const normEnglish = buildNormalized((ch) => /[A-Za-z]/.test(ch));

    if (normKorean.text.length === 0 && normEnglish.text.length === 0) {
      return { sanitized: original, hasCurse: false };
    }

    // 정규화된 문자열에서 비속어 검색 (긴 단어 우선)
    const mask: boolean[] = new Array(original.length).fill(false);
    for (let idx = 0; idx < this.cachedWords.length; idx++) {
      const word = this.cachedWords[idx];
      if (!word) continue;

      // 단어가 한글을 포함하면 한글 정규화 문자열을, 아니면 영문 정규화 문자열을 사용
      const isKoreanWord = /[가-힣]/.test(word);
      const target = isKoreanWord ? normKorean : normEnglish;
      if (target.text.length === 0) continue;

      const pattern = this.cachedPatterns[idx];
      let match: RegExpExecArray | null;
      pattern.lastIndex = 0; // lastIndex 초기화
      while ((match = pattern.exec(target.text)) !== null) {
        const startNorm = match.index;
        const endNorm = startNorm + word.length - 1;
        const startOrig = target.map[startNorm];
        const endOrig = target.map[endNorm];
        // 원본에서 해당 구간(사이에 끼어든 문자 포함)을 마스킹
        for (let i = startOrig; i <= endOrig; i++) mask[i] = true;
      }
    }

    // 마스킹 반영
    let hasCurse = mask.some(Boolean);
    const sanitized = hasCurse
      ? original
          .split('')
          .map((c, i) => (mask[i] ? '*' : c))
          .join('')
      : original;

    return { sanitized, hasCurse };
  }

  async loadFromMySQLToMemory(): Promise<void> {
    const items = await this.curseWordRepository.find({ select: ['word'] });
    const words = items.map((item) => item.word);
    await this.refreshCacheWithWords(words);
  }

  private async loadWithRetry(attempt: number): Promise<void> {
    try {
      await this.loadFromMySQLToMemory();
      this.logger.log('비속어 목록 초기 적재 완료 (MySQL -> Memory)');
      this.retryCount = 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`비속어 메모리 적재 실패 (시도 ${attempt + 1}/${this.MAX_RETRIES}): ${msg}`);

      if (attempt < this.MAX_RETRIES - 1) {
        const delayMs = this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);
        this.logger.log(`${delayMs}ms 후 재시도합니다...`);
        setTimeout(() => void this.loadWithRetry(attempt + 1), delayMs);
      } else {
        this.logger.error(`비속어 목록 적재 최종 실패 (${this.MAX_RETRIES}회 재시도)`);
      }
    }
  }

  private async refreshCacheWithWords(words: string[]): Promise<void> {
    // 긴 단어를 먼저 처리하도록 길이 기준 내림차순 정렬
    this.cachedWords = words.sort((a, b) => b.length - a.length);

    // 각 단어별 정규식 사전 컴파일
    this.cachedPatterns = this.cachedWords.map((word) => {
      const w = word.toLowerCase();
      return new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    });

    this.logger.log(`비속어 캐시 갱신 완료: ${this.cachedWords.length}건`);
  }

  private async refreshCache(): Promise<void> {
    if (this.cachedWords.length === 0) {
      await this.loadFromMySQLToMemory();
    }
  }
}
