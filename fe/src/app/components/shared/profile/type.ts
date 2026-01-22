export type ProfileVariant = 'row' | 'column';

export interface ProfileProps {
  nickname: string;
  profileImage?: string;
  variant: ProfileVariant;
}

export interface AvatarProps {
  nickname?: string;
  profileImage?: string;
  isActive?: boolean;
  onClick?: () => void;
}

export interface AvatarCountProps {
  count: number;
  onClick?: () => void;
}

export interface AvatarsProps {
  profiles: { nickname: string; profileImage?: string }[];
  viewCount?: number;
}
