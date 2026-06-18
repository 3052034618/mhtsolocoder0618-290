import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  FileText, Users, Wallet, Calendar as CIcon, Download, TrendingUp, Scissors, Search,
  BarChart3,
} from 'lucide-react';
import { useStore } from '@/store';
import { Avatar } from '@/components/Avatar';
import { Empty } from '@/components/Empty';
import { formatCurrency, formatDate, formatDateTime } from '@/utils';

const palette = ['#D4A853', '#E8C07A', '#F4E4C1', '#E4879D', '#8CB9A6', '#B88F55'];

export const Commission: React.FC = () => {
  const employees = useStore(s => s.employees);
  const transactions = useStore(s => s.transactions);
  const services = useStore(s => s.serviceItems);

  const [range, setRange] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [selEmp, setSelEmp] = useState<string | 'all'>('all');

  const start = useMemo(() => {
    const now = dayjs();
    if (range === 'quarter') return now.startOf('quarter' as any);
    if (range === 'year') return now.startOf('year');
    if (range === 'all') return dayjs('1970-01-01');
    return now.startOf('month');
  }, [range]);

  const txInRange = useMemo(() => transactions.filter(t => dayjs(t.createdAt).isAfter(start)), [transactions, start]);

  const empStats = useMemo(() => {
    const stats = new Map<string, { name: string; commission: number; services: number; revenue: number }>();
    employees.forEach(e => stats.set(e.id, { name: e.name, commission: 0, services: 0, revenue: 0 }));
    txInRange.forEach(t => {
      t.items.forEach(item => {
        if (!stats.has(item.employeeId)) return;
        const s = stats.get(item.employeeId)!;
        s.commission += item.commissionAmount;
        s.services += item.quantity;
        s.revenue += item.price * item.quantity;
      });
    });
    return stats;
  }, [txInRange, employees]);

  const chartData = useMemo(() => {
    return employees
      .map((e, i) => ({ name: e.name, value: empStats.get(e.id)?.commission || 0, fill: palette[i % palette.length] }))
      .sort((a, b) => b.value - a.value);
  }, [employees, empStats]);

  const totalCommission = chartData.reduce((s, d) => s + d.value, 0);
  const totalServices = Array.from(empStats.values()).reduce((s, e) => s + e.services, 0);
  const totalRevenue = Array.from(empStats.values()).reduce((s, e) => s + e.revenue, 0);

  // Detail list: transactions with items from selected employee(s)
  const details = useMemo(() => {
    const list: any[] = [];
    txInRange
      .filter(t => selEmp === 'all' || t.items.some(i => i.employeeId === selEmp))
      .forEach(t => {
        t.items.forEach(it => {
          if (selEmp !== 'all' && it.employeeId !== selEmp) return;
          if (!it.employeeId) return;
          list.push({
            id: `${t.id}-${it.serviceItemId}-${Math.random()}`,
            date: t.createdAt,
            member: t.memberName,
            service: it.serviceItemName,
            employee: it.employeeName,
            employeeId: it.employeeId,
            qty: it.quantity,
            price: it.price,
            actual: it.actualAmount || (it.price * it.quantity),
            commission: it.commissionAmount,
          });
        });
      });
    return list.sort((a, b) => dayjs(b.date).diff(dayjs(a.date)));
  }, [txInRange, selEmp]);

  const topEmp = chartData.find(d => d.value > 0);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">提成报表</h2>
          <p className="text-sm text-salon-sub mt-1">按员工和服务项目统计提成明细</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex rounded-xl border border-salon-line overflow-hidden bg-white">
            {[
              { k: 'month', l: '本月' },
              { k: 'quarter', l: '本季度' },
              { k: 'year', l: '本年' },
              { k: 'all', l: '全部' },
            ].map(r => (
              <button
                key={r.k}
                onClick={() => setRange(r.k as any)}
                className={`px-4 py-2 text-xs font-medium transition-all ${range === r.k ? 'bg-brand-gradient text-white' : 'text-salon-sub hover:text-salon-ink'}`}
              >{r.l}</button>
            ))}
          </div>
          <select
            value={selEmp}
            onChange={e => setSelEmp(e.target.value)}
            className="input !py-2 !px-4 text-sm !pr-10 max-w-[180px]"
          >
            <option value="all">全部员工</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-brand-100/60 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center">
                <Wallet size={15} />
              </div>
              <span className="text-xs text-salon-sub">总提成</span>
            </div>
            <div className="font-display text-2xl font-bold text-brand-600 tabular-nums">{formatCurrency(totalCommission)}</div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-rose-100/60 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                <TrendingUp size={15} />
              </div>
              <span className="text-xs text-salon-sub">服务营业额</span>
            </div>
            <div className="font-display text-2xl font-bold text-rose-500 tabular-nums">{formatCurrency(totalRevenue)}</div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-emerald-100/60 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-salon-green flex items-center justify-center">
                <Scissors size={15} />
              </div>
              <span className="text-xs text-salon-sub">服务次数</span>
            </div>
            <div className="font-display text-2xl font-bold text-salon-green tabular-nums">{totalServices} 次</div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-amber-100/60 blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Users size={15} />
              </div>
              <span className="text-xs text-salon-sub">本月冠军</span>
            </div>
            <div className="font-display text-xl font-bold text-amber-600 truncate">{topEmp?.name || '暂无'}</div>
          </div>
        </div>
      </div>

      {/* Chart + Employee list */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="card p-5 xl:col-span-3">
          <div className="section-title mb-4">
            <BarChart3 size={18} className="text-brand-500" />提成排行
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData} barSize={36} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5EBD9" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#A09889' }} tickFormatter={v => `¥${v}`} />
                <YAxis type="category" dataKey="name" width={70} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, border: '1px solid #F5EBD9', boxShadow: '0 8px 28px rgba(212,168,83,0.15)' }}
                  formatter={(v: any) => [formatCurrency(v), '提成金额']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 xl:col-span-2">
          <div className="section-title mb-4">
            <Users size={18} className="text-brand-500" />员工统计
          </div>
          <div className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
            {employees.map((e, i) => {
              const s = empStats.get(e.id) || { commission: 0, services: 0, revenue: 0 };
              const max = Math.max(...chartData.map(d => d.value), 1);
              const pct = (s.commission / max) * 100;
              return (
                <button
                  key={e.id}
                  onClick={() => setSelEmp(selEmp === e.id ? 'all' : e.id)}
                  className={`w-full text-left p-3 rounded-2xl border-2 transition-all
                    ${selEmp === e.id ? 'border-brand-400 bg-brand-50/60' : 'border-salon-line bg-white hover:border-brand-200'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar name={e.name} size="sm" isEmployee />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{e.name}</span>
                        <span className="text-[10px] text-salon-sub">{e.role}</span>
                      </div>
                      <div className="text-[11px] text-salon-sub">{s.services}次服务 · {formatCurrency(s.revenue)}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-bold text-brand-600 tabular-nums">{formatCurrency(s.commission)}</div>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-salon-bg overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${palette[i % palette.length]}, ${palette[(i + 1) % palette.length]})` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="section-title">
            <FileText size={18} className="text-brand-500" />提成明细
            <span className="ml-2 text-xs text-salon-sub font-normal">共 {details.length} 条记录</span>
          </div>
        </div>
        {details.length === 0 ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto -mx-5 -mb-5">
            <table className="w-full text-sm">
              <thead className="bg-salon-bg/60">
                <tr className="text-[11px] text-salon-sub uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">时间</th>
                  <th className="text-left px-5 py-3 font-semibold">顾客</th>
                  <th className="text-left px-5 py-3 font-semibold">服务项目</th>
                  <th className="text-left px-5 py-3 font-semibold">员工</th>
                  <th className="text-right px-5 py-3 font-semibold">数量</th>
                  <th className="text-right px-5 py-3 font-semibold">单价</th>
                  <th className="text-right px-5 py-3 font-semibold">实际金额</th>
                  <th className="text-right px-5 py-3 font-semibold">提成</th>
                </tr>
              </thead>
              <tbody>
                {details.slice(0, 80).map(d => (
                  <tr key={d.id} className="border-t border-salon-line/60 hover:bg-brand-50/30 transition-colors">
                    <td className="px-5 py-3 text-salon-sub text-[12px] tabular-nums whitespace-nowrap">{formatDateTime(d.date)}</td>
                    <td className="px-5 py-3 font-medium">{d.member || '散客'}</td>
                    <td className="px-5 py-3">{d.service}</td>
                    <td className="px-5 py-3 text-salon-ink">{d.employee}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{d.qty}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(d.price)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(d.actual)}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-brand-600">{formatCurrency(d.commission)}</td>
                  </tr>
                ))}
              </tbody>
              {details.length > 80 && (
                <tfoot><tr><td colSpan={8} className="px-5 py-4 text-center text-xs text-salon-sub">仅展示前 80 条，完整数据请导出</td></tr></tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      <div className="h-8" />
    </div>
  );
};
