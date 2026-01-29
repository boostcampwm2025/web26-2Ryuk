import { ReactNode } from 'react';

export type TextTooltipPosition = 'center' | 'left' | 'right';

export interface TextTooltipProps {
  text: string;
  anchorId: string;
}

export interface TooltipTriggerProps {
  dataAnchor: string;
  children: ReactNode;
}
