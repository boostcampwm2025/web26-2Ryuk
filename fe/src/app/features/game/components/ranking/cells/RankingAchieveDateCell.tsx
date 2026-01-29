'use client';

import { useEffect, useMemo, useState } from 'react';
import DateUtil from '@/utils/date';

interface RankingAchieveDateCellProps {
  achieveDate?: Date | null;
}

export default function RankingAchieveDateCell({ achieveDate }: RankingAchieveDateCellProps) {
  const describe = useMemo(() => () => DateUtil.describe(achieveDate), [achieveDate]);
  const [text, setText] = useState(describe);

  useEffect(() => {
    setText(describe());
    const interval = setInterval(() => setText(describe()), 500);
    return () => clearInterval(interval);
  }, [describe]);

  return <span>{text}</span>;
}
