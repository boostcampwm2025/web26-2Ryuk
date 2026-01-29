'use client';

import Avatar from '@/app/components/shared/profile/Avatar';

interface RankingProfileCellProps {
  nickname: string;
  profileImage: string;
}

export default function RankingProfileCell({ nickname, profileImage }: RankingProfileCellProps) {
  return <Avatar nickname={nickname} profileImage={profileImage} />;
}
