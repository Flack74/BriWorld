import { RANK_COLORS, RANK_NAMES } from '@/types/ranking';

interface RankBadgeProps {
  rank: string;
  tier: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankBadge({ rank, tier, size = 'md' }: RankBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const tierRoman = ['III', 'II', 'I'][tier - 1] || 'III';
  const color = RANK_COLORS[rank] || '#888';
  const name = RANK_NAMES[rank] || rank;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${color}20`,
        border: `2px solid ${color}`,
        color: color,
      }}
    >
      <span>{name}</span>
      <span className="opacity-75">{tierRoman}</span>
    </div>
  );
}
