import { Position } from './type';

const DEFAULT_OFFSET = 20;

export function isDragHandleElement(
  target: HTMLElement,
  widgetRef: React.RefObject<HTMLDivElement>,
  dragHandleId: string,
): boolean {
  let element: HTMLElement | null = target;
  while (element && element !== widgetRef.current) {
    if (element.id === dragHandleId) return true;
    element = element.parentElement;
  }
  return false;
}

export const calculateUnboundedPosition = (
  clientX: number,
  clientY: number,
  dragOffset: Position,
): Position => ({
  x: clientX - dragOffset.x,
  y: clientY - dragOffset.y,
});

export const calculateBoundedPosition = (
  position: Position,
  widgetWidth: number,
  widgetHeight: number,
): Position => {
  const padding = DEFAULT_OFFSET;
  const minX = padding;
  const minY = padding;
  const maxX = window.innerWidth - widgetWidth - padding;
  const maxY = window.innerHeight - widgetHeight - padding;
  return {
    x: Math.max(minX, Math.min(position.x, maxX)),
    y: Math.max(minY, Math.min(position.y, maxY)),
  };
};

export const getInitialPosition = (widgetElement: HTMLDivElement): Position => {
  const rect = widgetElement.getBoundingClientRect();
  return {
    x: window.innerWidth - rect.width - DEFAULT_OFFSET,
    y: window.innerHeight - rect.height - DEFAULT_OFFSET,
  };
};
