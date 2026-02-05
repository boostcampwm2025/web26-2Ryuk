export type GameMeta = {
  ID: string;
  TITLE: string;
  DESCRIPTION: string;
};

const BEAKER: GameMeta = {
  ID: '550e8400-e29b-41d4-a716-446655440001',
  TITLE: '비커 채우기',
  DESCRIPTION: '제한시간 동안 스페이스바를 빠르게 눌러 비커를 채워보세요.',
};

const REFLEX: GameMeta = {
  ID: '550e8400-e29b-41d4-a716-446655440002',
  TITLE: '반응속도 테스트',
  DESCRIPTION: '화면에 나타나는 신호에 최대한 빨리 반응하세요!',
};

const BUBBLE: GameMeta = {
  ID: '550e8400-e29b-41d4-a716-446655440003',
  TITLE: '물방울 캐치',
  DESCRIPTION: '터지기 직전의 물방울을 정확한 순간에 포착하세요.',
};

const GAMES = {
  BEAKER,
  REFLEX,
  BUBBLE,
  fromId(id?: string): GameMeta | undefined {
    if (id === BEAKER.ID) return BEAKER;
    if (id === REFLEX.ID) return REFLEX;
    if (id === BUBBLE.ID) return BUBBLE;
    return undefined;
  },
  values(): GameMeta[] {
    return [BEAKER, REFLEX, BUBBLE];
  },
} as const;

export default GAMES;
