import React from 'react';
import { User, Scissors } from 'lucide-react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  type?: 'member' | 'employee';
  isEmployee?: boolean;
}

const SIZE_MAP = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

const GRADIENTS = [
  'from-amber-300 via-amber-400 to-rose-300',
  'from-rose-300 via-pink-300 to-purple-300',
  'from-teal-300 via-emerald-300 to-cyan-300',
  'from-sky-300 via-indigo-300 to-violet-300',
  'from-orange-300 via-amber-300 to-yellow-300',
  'from-emerald-300 via-teal-300 to-sky-300',
];

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '', type, isEmployee }) => {
  const t = isEmployee ? 'employee' : (type || 'member');
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const initial = name ? name[0] : '?';

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br ${gradient}
        text-white font-semibold shadow-card ${SIZE_MAP[size]} ${className}`}
    >
      {initial}
      {t === 'employee' && (
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white shadow-card flex items-center justify-center">
          <Scissors size={9} className="text-brand-500 stroke-[2.5]" />
        </div>
      )}
      {!name && <User size={size === 'sm' ? 12 : size === 'md' ? 16 : 20} />}
    </div>
  );
};
