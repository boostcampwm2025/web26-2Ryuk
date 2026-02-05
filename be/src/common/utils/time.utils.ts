export function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)(ms|s|m|h|d)$/);
  if (!match) {
    const parsed = Number(expiresIn);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  const value = Number.parseInt(expiresIn, 10);
  if (expiresIn.endsWith('s')) {
    return value * 1000;
  } else if (expiresIn.endsWith('m')) {
    return value * 60 * 1000;
  } else if (expiresIn.endsWith('h')) {
    return value * 60 * 60 * 1000;
  } else if (expiresIn.endsWith('d')) {
    return value * 24 * 60 * 60 * 1000;
  }
  // 기본값 (예: 숫자로만 주어지면 초단위로 간주)
  return value * 1000;
}
