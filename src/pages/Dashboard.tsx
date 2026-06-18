import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import {
  TrendingUp, Users, UserPlus, UserX, ArrowUpRight, ArrowDownRight,
  Scissors, Clock,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { useStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/utils';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';

const COLORS = ['#D4A853', '#E8B4B8', '#2D4A3E', '#8B7355', '#C9A9A6', '#7FB069', '#E8A87C', '#85CDCA'];

export const Dashboard: React.FC = () => {
  const { members, transactions, employees, serviceItems, packageCards } = useStore();
  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  const monthStart = now.startOf('month');

  const stats = useMemo(() => {
    const todayTxs = transactions.filter(t => dayjs(t.createdAt).format('YYYY-MM-DD') === today);
    const todayIncome = todayTxs.reduce((s, t) => s + t.totalPaid, 0);
    const todayVisits = todayTxs.length;

    const monthMembers = members.filter(m => dayjs(m.createdAt).isAfter(monthStart.subtract(1, 'day')));
    const atRiskCount = members.filter(m => m.isAtRisk).length;

    const prev7Start = now.subtract(6, 'day').startOf('day');
    const incomeByDay: { date: string; amount: number; visits: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day');
      const key = d.format('MM-DD');
      const dayTxs = transactions.filter(t => dayjs(t.createdAt).format('MM-DD') === key);
      incomeByDay.push({
        date: key,
        amount: Math.round(dayTxs.reduce((s, t) => s + t.totalPaid, 0)),
        visits: dayTxs.length,
      });
    }

    const projMap: Record<string, { name: string; value: number }> = {};
    transactions
      .filter(t => dayjs(t.createdAt).isAfter(prev7Start.subtract(1, 'day')))
      .forEach(t => t.items.forEach(it => {
        if (!projMap[it.serviceItemId]) {
          projMap[it.serviceItemId] = { name: it.serviceItemName, value: 0 };
        }
        projMap[it.serviceItemId].value += it.price * it.quantity;
      }));
    const projectData = Object.values(projMap).sort((a, b) => b.value - a.value).slice(0, 8);

    const empMap: Record<string, { name: string; commission: number; count: number }> = {};
    employees.forEach(e => { empMap[e.id] = { name: e.name, commission: 0, count: 0 }; });
    transactions
      .filter(t => dayjs(t.createdAt).isAfter(monthStart.subtract(1, 'day')))
      .forEach(t => t.items.forEach(it => {
        if (empMap[it.employeeId]) {
          empMap[it.employeeId].commission += it.commissionAmount;
          empMap[it.employeeId].count += it.quantity;
        }
      }));
    const commissionData = Object.values(empMap)
      .filter(x => x.commission > 0)
      .sort((a, b) => b.commission - a.commission)
      .map(x => ({ ...x, commission: Math.round(x.commission * 100) / 100 }));

    const recentTxs = transactions.slice(0, 6);
    const topMembers = [...members].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    return {
      todayIncome, todayVisits,
      newMemberCount: monthMembers.length,
      atRiskCount,
      incomeByDay, projectData, commissionData,
      recentTxs, topMembers,
    };
  }, [transactions, members, employees]);

  const StatCard = ({
    title, value, unit, gradient, trend, trendLabel, icon,
  }: {
    title: string; value: string | number; unit?: string;
    gradient: string; trend?: 'up' | 'down' | 'flat'; trendLabel?: string;
    icon: React.ReactNode;
  }) => (
    <div className={`stat-card ${gradient}`}>
      <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-noise" />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="text-xs font-medium opacity-90">{title}</div>
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
          {unit && <span className="text-xs opacity-90">{unit}</span>}
        </div>
        {trendLabel && (
          <div className={`inline-flex items-center gap-1 text-xs rounded-lg px-2 py-0.5 bg-white/20 backdrop-blur
            ${trend === 'up' ? '' : ''}`}>
            {trend === 'up' && <ArrowUpRight size={12} />}
            {trend === 'down' && <ArrowDownRight size={12} />}
            {trendLabel}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">数据仪表盘</h2>
          <p className="text-sm text-salon-sub mt-1">
            {formatDateTime(new Date().toISOString())} · 经营数据一览
          </p>
        </div>
        <LevelBadge level="金卡" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="今日营业收入"
          value={formatCurrency(stats.todayIncome)}
          gradient="bg-gradient-to-br from-brand-500 to-brand-700"
          icon={<TrendingUp size={18} className="text-white" />}
          trend="up"
          trendLabel="较昨日 +12%"
        />
        <StatCard
          title="今日到店客流"
          value={stats.todayVisits}
          unit="人次"
          gradient="bg-gradient-to-br from-salon-green to-emerald-700"
          icon={<Scissors size={18} className="text-white" />}
          trend="up"
          trendLabel="较昨日 +3 人"
        />
        <StatCard
          title="本月新增会员"
          value={stats.newMemberCount}
          unit="人"
          gradient="bg-gradient-to-br from-rose-400 to-rose-600"
          icon={<UserPlus size={18} className="text-white" />}
          trend="flat"
          trendLabel="稳步增长中"
        />
        <StatCard
          title="流失预警会员"
          value={stats.atRiskCount}
          unit="人"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          icon={<UserX size={18} className="text-white" />}
          trend="down"
          trendLabel="需尽快唤回"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="section-title">
              <TrendingUp size={18} className="text-brand-500" />
              近7日收入趋势
            </div>
            <div className="flex items-center gap-4 text-xs text-salon-sub">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-brand-400 rounded-full" />营业收入
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-salon-green rounded-full" />到店人次
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.incomeByDay} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#D4A853" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#D4A853" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="#EDE8E1" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #EDE8E1', boxShadow: '0 4px 20px -4px rgba(31,35,40,0.1)' }}
                  labelStyle={{ fontWeight: 600, color: '#1F2328', marginBottom: 6 }}
                />
                <Line yAxisId="left" type="monotone" dataKey="amount" stroke="#D4A853" strokeWidth={2.5}
                  dot={{ fill: '#D4A853', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                  fill="url(#incGrad)" />
                <Line yAxisId="right" type="monotone" dataKey="visits" stroke="#2D4A3E" strokeWidth={2}
                  dot={{ fill: '#2D4A3E', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="section-title mb-5">
            <Users size={18} className="text-brand-500" />
            项目销售占比
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.projectData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.projectData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #EDE8E1', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            {stats.projectData.slice(0, 6).map((p, i) => (
              <div key={p.name} className="flex items-center gap-2 truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate text-salon-sub">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 card p-6">
          <div className="section-title mb-5">
            <Scissors size={18} className="text-brand-500" />
            本月员工提成排行
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.commissionData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="#EDE8E1" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6B6560' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 12, fill: '#1F2328', fontWeight: 500 }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: 12, border: '1px solid #EDE8E1', fontSize: 12 }}
                />
                <defs>
                  <linearGradient id="barG" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#D4A853" />
                    <stop offset="100%" stopColor="#E8B4B8" />
                  </linearGradient>
                </defs>
                <Bar dataKey="commission" fill="url(#barG)" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <div className="section-title mb-5">
            <Users size={18} className="text-brand-500" />
            消费总额 TOP 会员
          </div>
          <div className="space-y-3">
            {stats.topMembers.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-salon-bg transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-amber-400 text-white' :
                    i === 1 ? 'bg-slate-300 text-white' :
                    i === 2 ? 'bg-amber-700/80 text-white' : 'bg-salon-line text-salon-sub'}`}>
                  {i + 1}
                </div>
                <Avatar name={m.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    <LevelBadge level={m.level} className="!py-0 !px-1.5 text-[10px]" />
                  </div>
                  <div className="text-[11px] text-salon-sub">累计到店 {m.totalVisits} 次</div>
                </div>
                <div className="text-sm font-bold text-brand-600 tabular-nums">{formatCurrency(m.totalSpent)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="section-title">
            <Clock size={18} className="text-brand-500" />
            最近消费记录
          </div>
          <span className="text-xs text-salon-sub">共 {transactions.length} 条记录</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin -mx-2">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="text-xs text-salon-sub border-b border-salon-line">
                <th className="text-left py-3 px-4 font-medium">会员</th>
                <th className="text-left py-3 px-4 font-medium">服务项目</th>
                <th className="text-left py-3 px-4 font-medium">服务员工</th>
                <th className="text-right py-3 px-4 font-medium">实付金额</th>
                <th className="text-right py-3 px-4 font-medium">时间</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentTxs.map(t => (
                <tr key={t.id} className="border-b border-salon-line/60 hover:bg-salon-bg/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.memberName} size="sm" />
                      <span className="text-sm font-medium">{t.memberName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {t.items.slice(0, 3).map((it, i) => (
                        <span key={i} className="chip">{it.serviceItemName}×{it.quantity}</span>
                      ))}
                      {t.items.length > 3 && <span className="text-xs text-salon-sub">+{t.items.length - 3}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-sm text-salon-ink">
                    {[...new Set(t.items.map(i => i.employeeName))].join('、')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-brand-600 tabular-nums">{formatCurrency(t.totalPaid)}</td>
                  <td className="py-3.5 px-4 text-right text-xs text-salon-sub tabular-nums">
                    {formatDateTime(t.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-center text-xs text-salon-sub pt-2 pb-4">
        💡 共 {packageCards.length} 张在用套餐卡 · {serviceItems.filter(s => s.isActive).length} 个在售服务项目
      </div>
    </div>
  );
};
