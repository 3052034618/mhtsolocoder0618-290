import React from 'react';
import { Crown, Gem, Star, Circle } from 'lucide-react';
import type { MemberLevel } from '@/types';
import { levelColorClass } from '@/utils';

const ICONS: Record<MemberLevel, React.ReactNode> = {
  '普通': <Circle size={11} className="fill-current" />,
  '银卡': <Star size={11} className="fill-current" />,
  '金卡': <Crown size={11} className="fill-current" />,
  '钻石': <Gem size={11} className="fill-current" />,
};

export const LevelBadge: React.FC<{ level: MemberLevel; className?: string }> = ({ level, className = '' }) => (
  <span className={`badge ${levelColorClass[level]} ${className}`}>
    {ICONS[level]}
    {level}会员
  </span>
);
