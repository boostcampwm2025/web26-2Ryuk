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

    // 캐시 검증 및 갱신
    if (this.cachedWords.length === 0) {
      await this.refreshCache();
    }
    if (this.cachedWords.length === 0) {
      return { sanitized: message, hasCurse: false };
    }

    const original = message;
    const { normKoreanComplete, normKoreanWithJamo, normEnglish } = this.buildNormalizedTexts(original);

    if (normKoreanComplete.text.length === 0 && normKoreanWithJamo.text.length === 0 && normEnglish.text.length === 0) {
      return { sanitized: original, hasCurse: false };
    }

    const mask = this.searchAndCreateMask(original, normKoreanComplete, normKoreanWithJamo, normEnglish);
    return this.applyMaskToMessage(original, mask);
  }

  /**
   * 메시지의 한글/영문 정규화 텍스트와 인덱스 맵 생성
   */
  private buildNormalizedTexts(original: string) {
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

    // 완성형만 추출 (씨ㅁ발 같은 변형도 잡기 위해)
    const normKoreanComplete = buildNormalized((ch) => /[가-힣]/.test(ch));

    // 완성형 + 자모음 추출 (ㅅㅂ 같은 자모음 비속어 잡기 위해)
    const normKoreanWithJamo = buildNormalized((ch) => /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(ch));

    const normEnglish = buildNormalized((ch) => /[A-Za-z]/.test(ch));

    return { normKoreanComplete, normKoreanWithJamo, normEnglish };
  }

  /**
   * 비속어를 검색하여 마스킹할 영역 표시
   */
  private searchAndCreateMask(
    original: string,
    normKoreanComplete: { text: string; map: number[] },
    normKoreanWithJamo: { text: string; map: number[] },
    normEnglish: { text: string; map: number[] },
  ): boolean[] {
    const mask: boolean[] = new Array(original.length).fill(false);

    for (let idx = 0; idx < this.cachedWords.length; idx++) {
      const word = this.cachedWords[idx];
      if (!word) continue;

      const isKoreanWord = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(word);
      const hasJamo = /[ㄱ-ㅎㅏ-ㅣ]/.test(word);

      if (isKoreanWord) {
        // 자모음을 포함한 비속어는 자모음 포함 버전으로 검색
        if (hasJamo) {
          this.markCurseWordInMask(word, idx, mask, original, normKoreanWithJamo);
        } else {
          // 완성형만으로 된 비속어는 완성형으로만 검색 (바ㅁ보 같은 변형도 잡기 위해)
          this.markCurseWordInMask(word, idx, mask, original, normKoreanComplete);
        }
      } else {
        // 영문 비속어
        this.markCurseWordInMask(word, idx, mask, original, normEnglish);
      }
    }

    return mask;
  }

  /**
   * 특정 비속어를 마스크에 표시
   */
  private markCurseWordInMask(
    word: string,
    wordIdx: number,
    mask: boolean[],
    original: string,
    target: { text: string; map: number[] },
  ): void {
    if (target.text.length === 0) return;

    const pattern = this.cachedPatterns[wordIdx];
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0; // lastIndex 초기화

    while ((match = pattern.exec(target.text)) !== null) {
      const startNorm = match.index;
      const endNorm = startNorm + word.length - 1;
      const startOrig = target.map[startNorm];
      const endOrig = target.map[endNorm];

      // 원본에서 해당 구간(사이에 끼어든 문자 포함)을 마스킹
      for (let i = startOrig; i <= endOrig; i++) {
        mask[i] = true;
      }
    }
  }

  /**
   * 마스크 정보를 원본 메시지에 적용하여 결과 생성
   */
  private applyMaskToMessage(original: string, mask: boolean[]): SanitizeResult {
    const hasCurse = mask.some(Boolean);
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
      return new RegExp(w.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    });

    this.logger.log(`비속어 캐시 갱신 완료: ${this.cachedWords.length}건`);
  }

  private async refreshCache(): Promise<void> {
    if (this.cachedWords.length === 0) {
      await this.loadFromMySQLToMemory();
    }
  }
}
