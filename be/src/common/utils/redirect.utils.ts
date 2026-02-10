/**
 * protocol-relative 또는 외부 protocol URL 여부 판단
 * - //example.com
 * - http://example.com
 * - https://example.com
 */
function isProtocolRelative(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.startsWith('//') || lower.startsWith('http:') || lower.startsWith('https:');
}

/**
 * Open Redirect 방지를 위한 redirect 경로 검증
 *
 * 허용:
 *  - '/' 로 시작하는 내부 경로
 *
 * 차단:
 *  - '//', 'http:', 'https:' 로 시작하는 외부 경로
 *  - URL 디코딩 우회
 *  - 역슬래시 포함 경로
 */
export function isSafeRedirect(path: string): boolean {
  if (!path || typeof path !== 'string') return false;

  // 내부 경로만 허용
  if (!path.startsWith('/')) return false;

  // protocol / protocol-relative 차단
  if (isProtocolRelative(path)) return false;

  try {
    const decoded = decodeURIComponent(path);

    if (decoded.startsWith('/')) {
      const decodedTrimmed = decoded.slice(1);
      if (isProtocolRelative(decodedTrimmed)) return false;
    }

    if (decoded.includes('\\')) return false;
  } catch {
    return false;
  }

  return true;
}
