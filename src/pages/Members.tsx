import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Filter, AlertTriangle, Phone, Wallet, Gift, Calendar,
  ChevronRight, QrCode, X,
} from 'lucide-react';
import { useStore } from '@/store';
import type { MemberLevel } from '@/types';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { Empty } from '@/components/Empty';
import { formatCurrency, formatDate, daysBetween } from '@/utils';

type FilterKey = 'all' | 'risk' | MemberLevel;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部会员' },
  { key: 'risk', label: '流失预警' },
  { key: '钻石', label: '钻石会员' },
  { key: '金卡', label: '金卡会员' },
  { key: '银卡', label: '银卡会员' },
  { key: '普通', label: '普通会员' },
];

export const Members: React.FC = () => {
  const members = useStore(s => s.members);
  const employees = useStore(s => s.employees);
  const packageCards = useStore(s => s.packageCards);
  const nav = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return members.filter(m => {
      if (filter === 'risk' && !m.isAtRisk) return false;
      if (filter !== 'all' && filter !== 'risk' && m.level !== filter) return false;
      if (!kw) return true;
      return m.name.toLowerCase().includes(kw) || m.phone.includes(kw);
    }).sort((a, b) => (b.isAtRisk ? 1 : 0) - (a.isAtRisk ? 1 : 0));
  }, [members, keyword, filter]);

  const getStylist = (id?: string) => employees.find(e => e.id === id)?.name;
  const getPkgCount = (mid: string) => packageCards.filter(p => p.memberId === mid && p.usedCount < p.totalCount).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">会员管理</h2>
          <p className="text-sm text-salon-sub mt-1">
            共 {members.length} 位会员 · {members.filter(m => m.isAtRisk).length} 位需唤回
          </p>
        </div>
        <button onClick={() => nav('/members/new')} className="btn-primary">
          <Plus size={16} />
          新增会员档案
        </button>
      </div>

      {/* Search & filters */}
      <div className="card p-4 md:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
            <input
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              placeholder="搜索会员姓名或手机号..."
              className="input pl-11 pr-11"
            />
            {keyword && (
              <button onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg hover:bg-salon-line text-salon-sub flex items-center justify-center">
                <X size={14} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost flex-1 md:flex-none">
              <QrCode size={16} />扫码识别
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-salon-sub mr-1" />
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all
                ${filter === f.key
                  ? 'bg-brand-gradient text-white shadow-soft'
                  : 'bg-salon-bg text-salon-sub hover:bg-brand-50 hover:text-brand-700'}`}
            >
              {f.label}
              {f.key === 'risk' && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-600 text-[10px]">
                  {members.filter(m => m.isAtRisk).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Member grid */}
      {filtered.length === 0 ? (
        <Empty icon="search" text="未找到匹配的会员" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((m, i) => {
            const awayDays = daysBetween(m.lastVisitDate);
            const pkgCount = getPkgCount(m.id);
            return (
              <div
                key={m.id}
                onClick={() => nav(`/members/${m.id}`)}
                className="card-hover p-5 cursor-pointer animate-fade-in-up relative overflow-hidden group"
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                {m.isAtRisk && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full
                    bg-rose-50 text-rose-600 border border-rose-200 text-[11px] font-medium">
                    <AlertTriangle size={11} />流失预警
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <Avatar name={m.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-salon-ink truncate">{m.name}</span>
                      <LevelBadge level={m.level} className="!py-0 !px-1.5 text-[10px]" />
                      {m.gender}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-salon-sub">
                      <Phone size={11} />{m.phone}
                    </div>
                    {m.preferredStylistId && (
                      <div className="mt-1 text-[11px] text-salon-sub">
                        指定发型师：<span className="text-brand-600 font-medium">{getStylist(m.preferredStylistId) || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-salon-bg/70 p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-salon-sub mb-0.5">
                      <Wallet size={10} />余额
                    </div>
                    <div className="text-sm font-bold text-brand-600 tabular-nums">{formatCurrency(m.balance)}</div>
                  </div>
                  <div className="rounded-xl bg-salon-bg/70 p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-salon-sub mb-0.5">
                      <Gift size={10} />积分
                    </div>
                    <div className="text-sm font-bold text-rose-500 tabular-nums">{m.points}</div>
                  </div>
                  <div className="rounded-xl bg-salon-bg/70 p-2.5">
                    <div className="flex items-center gap-1 text-[10px] text-salon-sub mb-0.5">
                      <Calendar size={10} />到店
                    </div>
                    <div className="text-sm font-bold text-salon-green tabular-nums">{m.totalVisits}次</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-salon-line">
                  <div className="flex items-center gap-3">
                    {pkgCount > 0 && (
                      <span className="chip">
                        <Gift size={11} />套餐 × {pkgCount}
                      </span>
                    )}
                    {m.allergies.length > 0 && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-rose-50 text-rose-600 border border-rose-100">
                        过敏提示
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-salon-sub group-hover:text-brand-600 transition-colors">
                    <span>{awayDays > 0 ? `${awayDays}天未到店` : '近期活跃'}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="h-4" />
    </div>
  );
};
