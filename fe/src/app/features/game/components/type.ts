import { GameData } from '@/app/features/game/dtos/data';

export interface GameCardProps extends GameData {
  onSelect?: (id: string) => void;
}
