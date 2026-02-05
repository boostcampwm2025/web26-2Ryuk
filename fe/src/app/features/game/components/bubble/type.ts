export type OutlineCircleType = 'my' | 'highest';

export interface ExplodingBubbleProps {
  resetTrigger: number;
  explodeTrigger: number;
  /** 내가 클릭한 순간의 물방울 크기 기준 outline */
  myTrigger?: number;
  /** 최고점 갱신 순간의 물방울 크기 기준 outline */
  highestTrigger?: number;
  initialRadius: number;
  radiusStep: number;
  stepIntervalMs: number;
  onExplodeEnd?: () => void;
}
