import React from 'react';
import { Search, PackageOpen } from 'lucide-react';

interface EmptyProps {
  text?: string;
  icon?: 'search' | 'empty';
  query?: string;
}

export const Empty: React.FC<EmptyProps> = ({ text, icon = 'empty', query }) => {
  const t = query ? `未找到匹配 "${query}" 的结果` : (text || '暂无数据');
  const i = query ? 'search' : icon;
  return (
    <div className="flex flex-col items-center justify-center py-14 text-salon-sub">
      <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
        {i === 'search'
          ? <Search size={26} className="text-brand-400" />
          : <PackageOpen size={26} className="text-brand-400" />}
      </div>
      <p className="text-sm font-medium">{t}</p>
    </div>
  );
};
