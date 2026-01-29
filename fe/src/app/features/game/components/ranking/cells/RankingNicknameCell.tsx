'use client';

interface RankingNicknameCellProps {
  nickname: string;
}

export default function RankingNicknameCell({ nickname }: RankingNicknameCellProps) {
  return <span>{nickname}</span>;
}
