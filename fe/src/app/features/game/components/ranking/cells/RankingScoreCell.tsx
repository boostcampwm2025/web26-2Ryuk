'use client';

interface RankingScoreCellProps {
  score: number;
}

export default function RankingScoreCell({ score }: RankingScoreCellProps) {
  return <span>{score.toLocaleString()}</span>;
}
