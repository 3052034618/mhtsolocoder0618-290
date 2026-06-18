import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  TrendingUp, Users, UserPlus, UserX, ArrowUpRight, ArrowDownRight,
  Scissors, Clock, Wallet, CreditCard, Gift, Receipt,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart as ReBarChart, Bar,
} from 'recharts';
import { useStore } from '@/store';
import { formatCurrency, formatDateTime } from '@/utils';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';

const COLORS = ['#D4A853', '#E8B4B8', '#2D4A3E', '#8B7355', '#C9A9A6', '#7FB069', '#E8A87C', '#85CDCA'];

const TYPE_LABEL: Record<string, { label: string; color: string; gradient: string; icon: any }> = {
  service: { label: '服务收入', color: '#D4A853', gradient: 'from-brand-400 to-brand-700', icon: Scissors },
  package: { label: '套餐售卡', color: '#E4879D', gradient: 'from-rose-400 to-rose-600', icon: CreditCard },
  deposit: { label: '储值充值', color: '#2D4A3E', gradient: 'from-emerald-500 to-salon-green', icon: Wallet },
};

export const Dashboard: React.FC = () => {
  const { members, transactions, employees, serviceItems, packageCards, accountFlows } = useStore();
  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  const monthStart = now.startOf('month');

  const [range, setRange] = useState<'today' | '7days'>('today');

  const stats = useMemo(() => {
    const rangeStart = range === 'today'
      ? now.startOf('day')
      : now.subtract(6, 'day').startOf('day');

    const inRange = (dt: string) => dayjs(dt).isAfter(rangeStart.subtract(1, 'day'));

    // 用accountFlows分类统计，比transactions更精准区分三种类型
    const flows = accountFlows.filter(f => inRange(f.createdAt));
    let serviceIncome = 0; // 消费类实际支付金额
    let packageIncome = 0;
    let depositIncome = 0;
    const byDay: Record<string, { service: number; package: number; deposit: number; visits: number }> = {};

    for (let i = range === 'today' ? 0 : 6; i >= 0; i--) {
      const d = now.subtract(i, 'day');
      const k = d.format('MM-DD');
      byDay[k] = { service: 0, package: 0, deposit: 0, visits: 0 };
    }

    flows.forEach(f => {
      const key = dayjs(f.createdAt).format('MM-DD');
      if (byDay[key] === undefined) return;
      if (f.type === 'deposit') {
        depositIncome += f.amount;
        byDay[key].deposit += f.amount;
      } else if (f.type === 'package_buy') {
        packageIncome += f.amount;
        byDay[key].package += f.amount;
      } else if (f.type === 'consume') {
        // amount是负数（-realPay）
        const real = -f.amount;
        serviceIncome += real;
        byDay[key].service += real;
        byDay[key].visits += 1;
      }
    });

    // 消费单数（按transaction计）
    const txsInRange = transactions.filter(t => inRange(t.createdAt));
    const totalVisits = txsInRange.length;
    // 补上visits（按transaction算更准）
    Object.keys(byDay).forEach(k => {
      byDay[k].visits = transactions.filter(t => dayjs(t.createdAt).format('MM-DD') === k).length;
    });

    const totalIncome = serviceIncome + packageIncome + depositIncome;

    // 支付方式维度统计（从accountFlows的paymentDetail汇总）
    let payCash = 0, payWechat = 0, payAlipay = 0, payBalance = 0;
    flows.forEach(f => {
      const p = f.paymentDetail;
      if (!p) return;
      // 充值/套餐：正向amount中各支付方式直接加
      // 消费：f.amount是负数(-realPay)，但paymentDetail里是正数的实际支付金额，直接加即可
      payCash += p.cashPaid || 0;
      payWechat += p.wechatPaid || 0;
      payAlipay += p.alipayPaid || 0;
      payBalance += p.balancePaid || 0;
    });

    const monthMembers = members.filter(m => dayjs(m.createdAt).isAfter(monthStart.subtract(1, 'day')));
    const atRiskCount = members.filter(m => m.isAtRisk).length;

    // 7日线图数据
    const chart7 = Object.keys(byDay).map(k => ({
      date: k,
      服务收入: Math.round(byDay[k].service),
      套餐售卡: Math.round(byDay[k].package),
      储值充值: Math.round(byDay[k].deposit),
      到店人次: byDay[k].visits,
    }));

    // 服务项目销售占比（按近30天transaction items）
    const last30 = now.subtract(30, 'day');
    const projMap: Record<string, { name: string; value: number }> = {};
    transactions
      .filter(t => dayjs(t.createdAt).isAfter(last30))
      .forEach(t => t.items.forEach(it => {
        if (it.usePackage) return; // 套餐扣次不计入销售占比（购买时已记）
        if (!projMap[it.serviceItemId]) {
          projMap[it.serviceItemId] = { name: it.serviceItemName, value: 0 };
        }
        projMap[it.serviceItemId].value += (it.actualAmount || (it.price * it.quantity));
      }));
    // 加上accountFlow里的套餐购买（按serviceItemId归类）
    accountFlows
      .filter(f => f.type === 'package_buy' && dayjs(f.createdAt).isAfter(last30))
      .forEach(f => {
        const pc = packageCards.find(p => p.id === f.packageCardId);
        const key = pc?.serviceItemId || 'pkg';
        const name = pc ? `【套餐】${pc.serviceItemName}` : '套餐卡';
        if (!projMap[key]) projMap[key] = { name, value: 0 };
        projMap[key].value += f.amount;
      });
    const projectData = Object.values(projMap).sort((a, b) => b.value - a.value).slice(0, 8);

    // 员工提成
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
      totalIncome, serviceIncome, packageIncome, depositIncome,
      totalVisits,
      newMemberCount: monthMembers.length,
      atRiskCount,
      chart7, projectData, commissionData,
      recentTxs, topMembers,
      payCash, payWechat, payAlipay, payBalance,
    };
  }, [transactions, members, employees, accountFlows, range, packageCards]);

  const StatCard = ({
    title, value, unit, gradient, trend, trendLabel, icon, sub,
  }: {
    title: string; value: string | number; unit?: string; sub?: string;
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
        {sub && <div className="text-[11px] opacity-80">{sub}</div>}
        {trendLabel && (
          <div className={`inline-flex items-center gap-1 text-xs rounded-lg px-2 py-0.5 bg-white/20 backdrop-blur mt-1`}>
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
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">数据仪表盘</h2>
          <p className="text-sm text-salon-sub mt-1">
            {formatDateTime(new Date().toISOString())} · 经营数据一览
          </p>
        </div>
        <div className="flex rounded-xl border border-salon-line overflow-hidden bg-white">
          {[
            { k: 'today', l: '今日' },
            { k: '7days', l: '近7日' },
          ].map(r => (
            <button
              key={r.k}
              onClick={() => setRange(r.k as any)}
              className={`px-5 py-2 text-sm font-medium transition-all ${range === r.k ? 'bg-brand-gradient text-white' : 'text-salon-sub hover:text-salon-ink'}`}
            >{r.l}</button>
          ))}
        </div>
      </div>

      {/* 3大收入 + 客流 + 2会员指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard
          title={range === 'today' ? '今日·服务收入' : '近7日·服务收入'}
          value={formatCurrency(stats.serviceIncome)}
          gradient="bg-gradient-to-br from-brand-500 to-brand-700"
          icon={<Scissors size={18} className="text-white" />}
          sub="实际消费服务金额（扣套餐除外）"
        />
        <StatCard
          title={range === 'today' ? '今日·套餐售卡' : '近7日·套餐售卡'}
          value={formatCurrency(stats.packageIncome)}
          gradient="bg-gradient-to-br from-rose-400 to-rose-600"
          icon={<CreditCard size={18} className="text-white" />}
          sub="卖出的套餐卡金额"
        />
        <StatCard
          title={range === 'today' ? '今日·储值充值' : '近7日·储值充值'}
          value={formatCurrency(stats.depositIncome)}
          gradient="bg-gradient-to-br from-salon-green to-emerald-700"
          icon={<Wallet size={18} className="text-white" />}
          sub="会员储值本金（预收款）"
        />
        <StatCard
          title={range === 'today' ? '今日总营收' : '近7日总营收'}
          value={formatCurrency(stats.totalIncome)}
          gradient="bg-gradient-to-br from-indigo-500 to-violet-700"
          icon={<TrendingUp size={18} className="text-white" />}
          sub={`服务+套餐+储值 合计`}
        />
        <StatCard
          title={range === 'today' ? '今日到店' : '近7日到店'}
          value={stats.totalVisits}
          unit="人次"
          gradient="bg-gradient-to-br from-amber-400 to-orange-500"
          icon={<Clock size={18} className="text-white" />}
          sub={`本月新增会员 ${stats.newMemberCount}人`}
        />
      </div>

      {/* 会员小指标 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] text-salon-sub">会员总数</div>
            <div className="font-display text-xl font-bold text-salon-ink tabular-nums">{members.length}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
            <UserPlus size={18} />
          </div>
          <div>
            <div className="text-[11px] text-salon-sub">本月新增会员</div>
            <div className="font-display text-xl font-bold text-brand-600 tabular-nums">{stats.newMemberCount}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <UserX size={18} />
          </div>
          <div>
            <div className="text-[11px] text-salon-sub">流失预警</div>
            <div className="font-display text-xl font-bold text-amber-600 tabular-nums">{stats.atRiskCount}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-salon-green flex items-center justify-center shrink-0">
            <Gift size={18} />
          </div>
          <div>
            <div className="text-[11px] text-salon-sub">套餐卡总数</div>
            <div className="font-display text-xl font-bold text-salon-green tabular-nums">{packageCards.length}</div>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <div className="text-[11px] text-salon-sub">累计消费单</div>
            <div className="font-display text-xl font-bold text-sky-600 tabular-nums">{transactions.length}</div>
          </div>
        </div>
      </div>

      {/* 支付方式维度（按所选时间范围） */}
      <div>
        <div className="text-sm font-semibold text-salon-ink mb-3 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-brand-gradient" />
          {range === 'today' ? '今日' : '近7日'}·按支付方式统计
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '现金支付', value: stats.payCash, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
            { label: '微信支付', value: stats.payWechat, color: 'text-green-600', bg: 'bg-green-50', ring: 'ring-green-200' },
            { label: '支付宝', value: stats.payAlipay, color: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-200' },
            { label: '余额抵扣', value: stats.payBalance, color: 'text-brand-600', bg: 'bg-brand-50', ring: 'ring-brand-200' },
          ].map(p => (
            <div key={p.label} className={`card p-4 ${p.bg} bg-opacity-40 ring-1 ${p.ring}`}>
              <div className="text-[11px] text-salon-sub mb-1">{p.label}</div>
              <div className={`font-display text-2xl font-bold tabular-nums ${p.color}`}>{formatCurrency(p.value)}</div>
              <div className="mt-2 h-1 rounded-full bg-white/80 overflow-hidden">
                <div
                  className={`h-full rounded-full ${p.color.replace('text-', 'bg-')}`}
                  style={{
                    width: `${stats.totalIncome > 0 ? Math.min(100, (p.value / stats.totalIncome) * 100) : 0}%`,
                    opacity: 0.7,
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-salon-sub tabular-nums">
                占比 {stats.totalIncome > 0 ? ((p.value / stats.totalIncome) * 100).toFixed(1) : '0.0'}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7日趋势图 + 销售占比 */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="card p-5 xl:col-span-3">
          <div className="section-title mb-4">
            <TrendingUp size={17} className="text-brand-500" />
            {range === 'today' ? '今日按小时分布（模拟按日展示）' : '近7日收入构成趋势'}
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chart7} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5EBD9" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#A09889' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#A09889' }} tickFormatter={v => `¥${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: '1px solid #F5EBD9', boxShadow: '0 8px 28px rgba(212,168,83,0.15)' }}
                  formatter={(v: any) => formatCurrency(v)}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="服务收入" stroke={TYPE_LABEL.service.color} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="套餐售卡" stroke={TYPE_LABEL.package.color} strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="储值充值" stroke={TYPE_LABEL.deposit.color} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="section-title mb-4">
            <Scissors size={17} className="text-brand-500" />近30天·项目销售占比
          </div>
          {stats.projectData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-salon-sub">暂无销售数据</div>
          ) : (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.projectData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                      paddingAngle={2}
                    >
                      {stats.projectData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #F5EBD9' }}
                      formatter={(v: any) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin pr-1">
                {stats.projectData.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-salon-ink truncate">{p.name}</span>
                    </div>
                    <span className="tabular-nums font-medium text-salon-ink">{formatCurrency(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 员工提成 + TOP5会员 */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="card p-5 xl:col-span-3">
          <div className="section-title mb-4">
            <TrendingUp size={17} className="text-brand-500" />本月·员工提成排行
          </div>
          {stats.commissionData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-salon-sub">暂无数据</div>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={stats.commissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5EBD9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#A09889' }} tickFormatter={v => `¥${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 14, border: '1px solid #F5EBD9' }}
                    formatter={(v: any) => [formatCurrency(v), '提成金额']}
                  />
                  <Bar dataKey="commission" radius={[8, 8, 0, 0]} fill="#D4A853" />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="section-title mb-4">
            <Users size={17} className="text-brand-500" />TOP 5 消费会员
          </div>
          <div className="space-y-3">
            {stats.topMembers.map((m, i) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50/50 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white shadow-soft
                  ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                    : i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600'
                      : i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800'
                        : 'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
                  {i + 1}
                </div>
                <Avatar name={m.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    <LevelBadge level={m.level} className="!py-0 !px-1 !text-[10px]" />
                  </div>
                  <div className="text-[10px] text-salon-sub">{m.totalVisits}次到店</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-brand-600 tabular-nums">{formatCurrency(m.totalSpent)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最近消费记录 */}
      <div className="card p-5">
        <div className="section-title mb-4">
          <Clock size={17} className="text-brand-500" />最近消费记录
        </div>
        {stats.recentTxs.length === 0 ? (
          <div className="py-10 text-center text-sm text-salon-sub">暂无消费记录</div>
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead className="bg-salon-bg/60">
                <tr className="text-[11px] text-salon-sub uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">时间</th>
                  <th className="text-left px-5 py-3 font-semibold">顾客</th>
                  <th className="text-left px-5 py-3 font-semibold">项目摘要</th>
                  <th className="text-right px-5 py-3 font-semibold">套餐抵扣</th>
                  <th className="text-right px-5 py-3 font-semibold">实付</th>
                  <th className="text-right px-5 py-3 font-semibold">积分</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTxs.map(t => (
                  <tr key={t.id} className="border-t border-salon-line/60 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-3 text-salon-sub text-[12px] tabular-nums whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                    <td className="px-5 py-3 font-medium">{t.memberName}</td>
                    <td className="px-5 py-3 text-salon-ink text-xs">
                      {t.items.slice(0, 2).map((i, k) => (
                        <span key={k} className="mr-3">
                          {i.serviceItemName}×{i.quantity}
                          {i.usePackage && <span className="text-amber-600 ml-1 text-[10px]">[套餐]</span>}
                        </span>
                      ))}
                      {t.items.length > 2 && <span className="text-salon-sub">+{t.items.length - 2}</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-amber-600">{t.packageDeducted > 0 ? formatCurrency(t.packageDeducted) : '-'}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-brand-600">{formatCurrency(t.totalPaid)}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs">
                      {t.pointsEarned > 0 && <span className="text-rose-500">+{t.pointsEarned}</span>}
                      {t.pointsUsed > 0 && <span className="text-salon-sub ml-1">-{t.pointsUsed}</span>}
                      {!t.pointsEarned && !t.pointsUsed && <span className="text-salon-sub">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
};
