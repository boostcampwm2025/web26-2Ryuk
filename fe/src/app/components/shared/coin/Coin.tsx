'use client';

import CSSUtil from '@/utils/css';
import styles from './coin.module.css';

type CoinVariant = 'default' | 'gold' | 'silver' | 'bronze';

interface CoinProps {
  number: number;
  variant?: CoinVariant;
}

const variantClass: Record<CoinVariant, string> = {
  default: styles.default,
  gold: styles.gold,
  silver: styles.silver,
  bronze: styles.bronze,
};

export function Coin({ number, variant = 'default' }: CoinProps) {
  const className = CSSUtil.buildCls(styles.coin, variantClass[variant]);
  return (
    <span className={className} aria-label={`rank-${number}`}>
      <span className={styles.number}>{number}</span>
    </span>
  );
}

export function GoldCoin(props: Omit<CoinProps, 'variant'>) {
  return <Coin {...props} variant="gold" />;
}

export function SilverCoin(props: Omit<CoinProps, 'variant'>) {
  return <Coin {...props} variant="silver" />;
}

export function BronzeCoin(props: Omit<CoinProps, 'variant'>) {
  return <Coin {...props} variant="bronze" />;
}

interface RankCoinProps {
  rank: number;
}

export function RankCoin({ rank }: RankCoinProps) {
  const rankIndex = rank >= 1 && rank <= 3 ? rank : 0;
  const variant = (['default', 'gold', 'silver', 'bronze'] as CoinVariant[])[rankIndex];
  return <Coin number={rank} variant={variant} />;
}
