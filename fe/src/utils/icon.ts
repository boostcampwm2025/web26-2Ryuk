import { readFileSync } from 'fs';
import { join } from 'node:path';

/**
 * SVG 파일에서 아이콘 목록을 동적으로 추출하는 유틸리티 클래스
 */
class IconUtil {
  private static cache: Record<string, string[]> = {};

  /** 기본 fallback 아이콘 이름 */
  static readonly DEFAULT_FALLBACK_ICON = 'photo';

  /**
   * SVG 파일에서 아이콘 목록을 동적으로 추출하는 함수
   * @param svgFileName - SVG 파일 이름 (예: "icons.svg")
   * @returns 아이콘 이름 배열
   * @example
   * ```typescript
   * IconUtil.extractNames("icons.svg") // ["home", "user", "settings", ...]
   * ```
   */
  static extractNames(svgFileName: string): string[] {
    if (this.cache[svgFileName]) return this.cache[svgFileName];

    const svgPath = join(process.cwd(), 'public', 'icons', svgFileName);
    const svgContent = readFileSync(svgPath, 'utf-8');

    const symbolIdRegex = /<symbol\s+id="icons\.([^"]+)"/g;
    const iconNames: string[] = [];

    let match;
    while ((match = symbolIdRegex.exec(svgContent)) !== null) iconNames.push(match[1]);

    this.cache[svgFileName] = iconNames;
    return iconNames;
  }

  /**
   * 아이콘이 SVG에 존재하는지 확인하는 함수
   * @param name - 아이콘 이름
   * @param svgFileName - SVG 파일 이름 (기본값: "icons.svg")
   * @returns 존재 여부
   * @example
   * ```typescript
   * IconUtil.exists("home", "icons.svg") // true
   * IconUtil.exists("invalid", "icons.svg") // false
   * ```
   */
  static exists(name: string, svgFileName: string = 'icons.svg'): boolean {
    const names = this.extractNames(svgFileName);
    return names.includes(name);
  }
}

export default IconUtil;
