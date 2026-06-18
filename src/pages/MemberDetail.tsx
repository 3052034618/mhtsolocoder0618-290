import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit3, CreditCard, Wallet, Gift, MessageSquare, AlertTriangle,
  Calendar, Clock, Scissors, TrendingUp, User, Phone,
  History, ChevronDown, ChevronUp, Receipt, Banknote, Smartphone, PiggyBank,
} from 'lucide-react';
import { useStore } from '@/store';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { Empty } from '@/components/Empty';
import {
  formatCurrency, formatDateTime, formatDate, daysBetween, maskPhone, levelDiscount, levelMultiplier,
} from '@/utils';
import dayjs from 'dayjs';
import { useToast } from '@/components/Toast';
import type { AccountFlow, AccountFlowType } from '@/types';

type DetailTab = 'consume' | 'packages' | 'flows';

const FLOW_STYLE: Record<AccountFlowType, {
  label: string; icon: any; ringBg: string; iconBg: string; iconCls: string;
  badgeBg: string; badgeCls: string; amountCls: string; amountSign: '+' | '-' | '';
}> = {
  deposit: {
    label: '储值充值', icon: Wallet,
    ringBg: 'ring-emerald-200', iconBg: 'bg-emerald-50', iconCls: 'text-emerald-600',
    badgeBg: 'bg-emerald-50', badgeCls: 'text-emerald-700',
    amountCls: 'text-emerald-600', amountSign: '+',
  },
  package_buy: {
    label: '套餐购买', icon: CreditCard,
    ringBg: 'ring-rose-200', iconBg: 'bg-rose-50', iconCls: 'text-rose-500',
    badgeBg: 'bg-rose-50', badgeCls: 'text-rose-700',
    amountCls: 'text-rose-500', amountSign: '+',
  },
  consume: {
    label: '消费结账', icon: Scissors,
    ringBg: 'ring-brand-200', iconBg: 'bg-brand-50', iconCls: 'text-brand-600',
    badgeBg: 'bg-brand-50', badgeCls: 'text-brand-700',
    amountCls: 'text-brand-700', amountSign: '-',
  },
  adjust: {
    label: '账户调整', icon: Receipt,
    ringBg: 'ring-slate-200', iconBg: 'bg-slate-50', iconCls: 'text-slate-600',
    badgeBg: 'bg-slate-50', badgeCls: 'text-slate-700',
    amountCls: 'text-slate-600', amountSign: '',
  },
};

export const MemberDetail: React.FC = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState<DetailTab>('consume');
  const [expandedFlow, setExpandedFlow] = useState<string | null>(null);

  const m = useStore(s => s.members.find(x => x.id === id));
  const txs = useStore(s => s.transactions.filter(t => t.memberId === id));
  const pkgs = useStore(s => s.packageCards.filter(p => p.memberId === id));
  const coupons = useStore(s => s.coupons.filter(c => c.memberId === id));
  const employees = useStore(s => s.employees);
  const flows = useStore(s => s.accountFlows.filter(f => f.memberId === id));
  const addCoupon = useStore(s => s.addCoupon);

  const preferred = useMemo(() => employees.find(e => e.id === m?.preferredStylistId), [employees, m]);

  if (!m) return (
    <div className="flex flex-col items-center py-20">
      <Empty text="会员不存在" />
      <button onClick={() => nav('/members')} className="btn-primary mt-6">
        <ArrowLeft size={16} />返回会员列表
      </button>
    </div>
  );

  const awayDays = daysBetween(m.lastVisitDate);
  const validPkgs = pkgs.filter(p => dayjs(p.expireDate).isAfter(dayjs()) || p.usedCount < p.totalCount);
  const sortedFlows = useMemo(
    () => [...flows].sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()),
    [flows],
  );

  const sendSMS = (type: string) => {
    toast.show(`已向 ${maskPhone(m.phone)} 发送${type}短信`, 'success');
    if (type === '生日祝福') {
      addCoupon({
        memberId: m.id,
        name: '生日专属优惠券',
        discountType: 'fixed',
        discountValue: 66,
        minAmount: 200,
        expireDate: dayjs().add(30, 'day').toISOString(),
        isUsed: false,
      });
    }
    if (type === '唤回') {
      addCoupon({
        memberId: m.id,
        name: '老会员唤回券',
        discountType: 'percent',
        discountValue: 20,
        minAmount: 100,
        expireDate: dayjs().add(15, 'day').toISOString(),
        isUsed: false,
      });
    }
  };

  const tabs: { k: DetailTab; l: string; icon: any; count: number }[] = [
    { k: 'consume', l: '消费记录', icon: Receipt, count: txs.length },
    { k: 'packages', l: '套餐 · 卡券', icon: Gift, count: validPkgs.length + coupons.filter(c => !c.isUsed).length },
    { k: 'flows', l: '完整账户流水', icon: History, count: sortedFlows.length },
  ];

  const flowAmount = (f: AccountFlow) => {
    if (f.type === 'consume') return Math.abs(f.amount);
    return f.amount;
  };

  return (
    <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => nav('/members')} className="btn-ghost !p-2.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-salon-ink">会员档案详情</h2>
            {m.isAtRisk && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle size={12} />流失预警 · {awayDays}天未到店
              </span>
            )}
          </div>
          <p className="text-sm text-salon-sub mt-1">档案创建于 {formatDate(m.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {m.isAtRisk && (
            <button onClick={() => sendSMS('唤回')} className="btn-ghost !text-rose-600 !border-rose-200 hover:!bg-rose-50">
              <MessageSquare size={15} />一键唤回
            </button>
          )}
          <button onClick={() => sendSMS('普通关怀')} className="btn-ghost">
            <MessageSquare size={15} />发送短信
          </button>
          <button onClick={() => nav(`/cashier?m=${m.id}`)} className="btn-primary">
            <CreditCard size={15} />立即消费
          </button>
          <button onClick={() => nav(`/recharge?m=${m.id}`)} className="btn-ghost">
            <Wallet size={15} />充值
          </button>
          <button onClick={() => nav(`/members/${m.id}/edit`)} className="btn-ghost">
            <Edit3 size={15} />编辑
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="card overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-brand-400 via-brand-300 to-rose-300 relative">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-noise" />
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-5">
            <div className="relative">
              <Avatar name={m.name} size="xl" className="!w-24 !h-24 !text-3xl ring-4 ring-white shadow-soft" />
              {m.isAtRisk && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-card">
                  <AlertTriangle size={14} />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h3 className="font-display text-2xl font-bold">{m.name}</h3>
                <LevelBadge level={m.level} />
                <span className="chip">{m.gender}士</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-salon-sub">
                <span className="inline-flex items-center gap-1.5"><Phone size={14} />{m.phone}</span>
                {m.birthday && (
                  <span className="inline-flex items-center gap-1.5">
                    <Gift size={14} />生日 {formatDate(m.birthday)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />最近到店 {formatDate(m.lastVisitDate)}
                </span>
                {preferred && (
                  <span className="inline-flex items-center gap-1.5 text-brand-600 font-medium">
                    <Scissors size={14} />指定 {preferred.name}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 md:w-auto gap-3 md:gap-4 w-full">
              {[
                { label: '账户余额', value: formatCurrency(m.balance), icon: Wallet, cls: 'text-brand-600' },
                { label: '可用积分', value: m.points, icon: Gift, cls: 'text-rose-500' },
                { label: '累计消费', value: formatCurrency(m.totalSpent), icon: TrendingUp, cls: 'text-salon-green' },
                { label: '到店次数', value: `${m.totalVisits}次`, icon: Clock, cls: 'text-indigo-500' },
              ].map(s => (
                <div key={s.label} className="bg-salon-bg/60 rounded-2xl p-3 text-center min-w-[100px]">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white shadow-card mb-1.5 ${s.cls}`}>
                    <s.icon size={14} />
                  </div>
                  <div className={`text-lg font-bold tabular-nums ${s.cls}`}>{s.value}</div>
                  <div className="text-[11px] text-salon-sub mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Level info */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-rose-50 border border-brand-100/50">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
              <div>
                <span className="text-xs text-salon-sub">等级权益</span>
                <div className="text-sm font-semibold text-brand-700 mt-0.5">
                  消费1元 = {levelMultiplier(m.level)}积分 · 享 {(100 - levelDiscount(m.level) * 100).toFixed(0)}% 折扣
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-salon-sub">距{['钻石', '金卡', '银卡'].includes(m.level) ? (m.level === '钻石' ? '保持钻石' : '升级') : '升级银卡'}</div>
                <div className="text-sm font-bold text-brand-700 tabular-nums">
                  {m.level === '钻石' ? '已达顶级' :
                    `¥${(
                      (m.level === '普通' ? 500 : m.level === '银卡' ? 2000 : 5000) - m.totalSpent
                    ).toFixed(2)}`}
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white overflow-hidden">
              <div className="h-full bg-brand-gradient rounded-full transition-all"
                style={{ width: `${Math.min(100,
                  m.level === '普通' ? (m.totalSpent / 500) * 100 / 4 :
                  m.level === '银卡' ? 25 + ((m.totalSpent - 500) / 1500) * 100 / 4 :
                  m.level === '金卡' ? 50 + ((m.totalSpent - 2000) / 3000) * 100 / 4 : 100
                )}%` }} />
            </div>
          </div>

          {/* Tags */}
          {(m.allergies.length > 0 || m.remark) && (
            <div className="mt-5 space-y-3">
              {m.allergies.length > 0 && (
                <div>
                  <div className="text-xs text-salon-sub mb-1.5">⚠️ 过敏提示</div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.allergies.map(a => (
                      <span key={a} className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-600 border border-rose-100">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {m.remark && (
                <div>
                  <div className="text-xs text-salon-sub mb-1.5">📝 服务备注</div>
                  <div className="text-sm text-salon-ink p-3 rounded-xl bg-salon-bg/70 border border-salon-line">{m.remark}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="card overflow-hidden">
        <div className="flex border-b border-salon-line/70 bg-salon-bg/40">
          {tabs.map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex-1 min-w-0 px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-medium border-b-2 transition-all
                ${tab === t.k
                  ? 'border-brand-500 text-brand-700 bg-white'
                  : 'border-transparent text-salon-sub hover:text-salon-ink hover:bg-white/60'}`}
            >
              <t.icon size={15} />
              <span>{t.l}</span>
              {t.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums
                  ${tab === t.k ? 'bg-brand-100 text-brand-700' : 'bg-slate-200/70 text-slate-600'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Tab 1: 消费记录 */}
          {tab === 'consume' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="text-xs text-salon-sub">
                  共 {txs.length} 笔消费 · 累计实付 <span className="font-semibold text-brand-600 tabular-nums">{formatCurrency(txs.reduce((s, t) => s + t.totalPaid, 0))}</span>
                </div>
              </div>
              {txs.length === 0 ? (
                <Empty text="暂无消费记录" />
              ) : (
                <div className="space-y-3">
                  {txs.map(t => (
                    <div key={t.id} className="p-4 rounded-2xl border border-salon-line hover:bg-salon-bg/50 transition-colors">
                      <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-brand-gradient/10 flex items-center justify-center text-brand-500">
                            <Scissors size={16} />
                          </div>
                          <div>
                            <div className="text-[11px] text-salon-sub">{formatDateTime(t.createdAt)}</div>
                            <div className="text-xs text-salon-sub mt-0.5">
                              操作人：{employees.find(e => e.id === t.createdBy)?.name || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-brand-600 tabular-nums">{formatCurrency(t.totalPaid)}</div>
                          {t.pointsEarned > 0 && (
                            <div className="text-[10px] text-rose-500">+{t.pointsEarned}积分</div>
                          )}
                        </div>
                      </div>
                      <div className="pl-11 space-y-1.5">
                        {t.items.map((it, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-salon-ink">
                              <span className="font-medium">{it.serviceItemName} × {it.quantity}</span>
                              {it.usePackage && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px]">套餐扣次</span>}
                              <span className="text-salon-sub">服务：{it.employeeName}</span>
                            </div>
                            <span className="tabular-nums text-salon-sub">{formatCurrency(it.price * it.quantity)}</span>
                          </div>
                        ))}
                        {(t.balanceUsed > 0 || t.pointsUsed > 0 || t.packageDeducted > 0 || t.cashPaid > 0 || t.wechatPaid > 0 || t.alipayPaid > 0) && (
                          <div className="pt-2 mt-1 border-t border-dashed border-salon-line space-y-0.5 text-[11px] text-salon-sub">
                            {t.packageDeducted > 0 && <div>套餐抵扣：{formatCurrency(t.packageDeducted)}</div>}
                            {t.pointsUsed > 0 && <div>积分抵扣：-{formatCurrency(t.pointsUsed / 100)}</div>}
                            {t.balanceUsed > 0 && <div>余额支付：{formatCurrency(t.balanceUsed)}</div>}
                            {t.cashPaid > 0 && <div>现金支付：{formatCurrency(t.cashPaid)}</div>}
                            {t.wechatPaid > 0 && <div>微信支付：{formatCurrency(t.wechatPaid)}</div>}
                            {t.alipayPaid > 0 && <div>支付宝支付：{formatCurrency(t.alipayPaid)}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 套餐卡 + 优惠券 */}
          {tab === 'packages' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-salon-ink flex items-center gap-2">
                    <CreditCard size={15} className="text-brand-500" />
                    套餐卡（{validPkgs.length}张在用）
                  </div>
                  <button onClick={() => nav(`/recharge?m=${m.id}&tab=pkg`)} className="btn-soft text-xs py-1.5">
                    购买套餐
                  </button>
                </div>
                {validPkgs.length === 0 ? (
                  <div className="py-8 text-center text-sm text-salon-sub rounded-2xl border border-dashed border-salon-line">暂无在用套餐</div>
                ) : (
                  <div className="space-y-3">
                    {validPkgs.map(p => {
                      const remain = p.totalCount - p.usedCount;
                      const pct = (p.usedCount / p.totalCount) * 100;
                      const expSoon = dayjs(p.expireDate).diff(dayjs(), 'day') < 30;
                      return (
                        <div key={p.id} className="p-4 rounded-2xl border border-salon-line bg-salon-bg/50">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="font-semibold text-salon-ink">{p.serviceItemName}</div>
                              <div className="text-[11px] text-salon-sub mt-0.5">
                                有效期至 {formatDate(p.expireDate)}
                                {expSoon && <span className="ml-1.5 text-amber-600 font-medium">即将到期</span>}
                              </div>
                              <div className="text-[10px] text-salon-sub mt-1">
                                购于 {formatDate(p.purchaseDate)} · 原价 {formatCurrency(p.purchasePrice)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-display font-bold text-brand-600 tabular-nums">{remain}</div>
                              <div className="text-[10px] text-salon-sub">剩余 / 共{p.totalCount}次</div>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-white overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-400' : 'bg-brand-gradient'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-semibold text-salon-ink flex items-center gap-2">
                    <Gift size={15} className="text-rose-400" />
                    优惠券（{coupons.filter(c => !c.isUsed).length}张可用）
                  </div>
                </div>
                {coupons.filter(c => !c.isUsed).length === 0 ? (
                  <div className="py-8 text-center text-sm text-salon-sub rounded-2xl border border-dashed border-salon-line">
                    暂无可用优惠券<br/>
                    <span className="text-[11px]">发送生日祝福或会员唤回可自动发放</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coupons.filter(c => !c.isUsed).map(c => (
                      <div key={c.id} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-brand-50 border border-rose-100 p-4 flex items-center gap-4">
                        <div className="shrink-0 text-center w-20 border-r border-dashed border-rose-200 pr-4">
                          <div className="text-2xl font-display font-bold text-rose-500 tabular-nums">
                            {c.discountType === 'fixed' ? `¥${c.discountValue}` : `${c.discountValue}%`}
                          </div>
                          <div className="text-[10px] text-rose-400 mt-0.5">OFF</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-salon-ink">{c.name}</div>
                          <div className="text-[11px] text-salon-sub mt-0.5">满{c.minAmount}元可用 · 至 {formatDate(c.expireDate)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: 完整账户流水（时间线） */}
          {tab === 'flows' && (
            <div>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="text-xs text-salon-sub">
                  共 {sortedFlows.length} 条流水 · 时间倒序排列 · 点击展开可看支付方式明细
                </div>
                {sortedFlows.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {(['deposit', 'package_buy', 'consume'] as AccountFlowType[]).map(ty => {
                      const st = FLOW_STYLE[ty];
                      const cnt = sortedFlows.filter(f => f.type === ty).length;
                      return (
                        <span key={ty} className={`px-2 py-1 rounded-lg ${st.badgeBg} ${st.badgeCls} font-medium`}>
                          {st.label} {cnt}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              {sortedFlows.length === 0 ? (
                <Empty text="暂无账户流水，充值或消费后会在此显示" />
              ) : (
                <div className="relative">
                  {/* timeline vertical line */}
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-brand-200 via-rose-200 to-emerald-200 rounded-full" />
                  <div className="space-y-3">
                    {sortedFlows.map((f, idx) => {
                      const st = FLOW_STYLE[f.type] || FLOW_STYLE.adjust;
                      const Icon = st.icon;
                      const expanded = expandedFlow === f.id;
                      const displayAmt = flowAmount(f);
                      const pd = f.paymentDetail || { cashPaid: 0, wechatPaid: 0, alipayPaid: 0, balancePaid: 0 };
                      const hasAnyPay = pd.cashPaid || pd.wechatPaid || pd.alipayPaid || pd.balancePaid;
                      const sameDay = idx > 0 && dayjs(f.createdAt).format('YYYY-MM-DD') === dayjs(sortedFlows[idx - 1].createdAt).format('YYYY-MM-DD');
                      return (
                        <div key={f.id}>
                          {!sameDay && (
                            <div className="relative pl-12 mb-2 mt-1">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                {formatDate(f.createdAt)}
                              </span>
                            </div>
                          )}
                          <div className="relative pl-12">
                            {/* timeline dot */}
                            <div className={`absolute left-0 top-4 w-9 h-9 rounded-full ring-4 ring-white ${st.ringBg} ${st.iconBg} flex items-center justify-center shadow-soft z-10`}>
                              <Icon size={15} className={st.iconCls} />
                            </div>
                            <div
                              className={`card p-4 cursor-pointer transition-all hover:shadow-card ${expanded ? 'ring-2 ring-brand-300' : ''}`}
                              onClick={() => setExpandedFlow(expanded ? null : f.id)}
                            >
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${st.badgeBg} ${st.badgeCls}`}>
                                      {st.label}
                                    </span>
                                    <span className="font-semibold text-sm text-salon-ink truncate">{f.title}</span>
                                  </div>
                                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-salon-sub flex-wrap">
                                    <span className="inline-flex items-center gap-1">
                                      <Clock size={11} />{formatDateTime(f.createdAt)}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <User size={11} />操作：{f.operatorName || '-'}
                                    </span>
                                    {(f.balanceChange !== 0 || f.pointsChange !== 0) && (
                                      <span className="inline-flex items-center gap-2">
                                        {f.balanceChange !== 0 && (
                                          <span className={f.balanceChange > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                            余额{f.balanceChange > 0 ? '+' : ''}{formatCurrency(f.balanceChange)}
                                          </span>
                                        )}
                                        {f.pointsChange !== 0 && (
                                          <span className={f.pointsChange > 0 ? 'text-rose-500' : 'text-slate-500'}>
                                            积分{f.pointsChange > 0 ? '+' : ''}{f.pointsChange}
                                          </span>
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className={`text-right`}>
                                    <div className={`font-display text-xl font-bold tabular-nums ${st.amountCls}`}>
                                      {st.amountSign && f.type !== 'adjust' ? st.amountSign : ''}
                                      {formatCurrency(displayAmt)}
                                    </div>
                                    {f.remark && <div className="text-[10px] text-salon-sub mt-0.5">{f.remark}</div>}
                                  </div>
                                  {expanded
                                    ? <ChevronUp size={16} className="text-salon-sub" />
                                    : <ChevronDown size={16} className="text-salon-sub" />}
                                </div>
                              </div>

                              {expanded && (
                                <div className="mt-4 pt-4 border-t border-dashed border-salon-line space-y-3 animate-fade-in-up">
                                  {hasAnyPay && (
                                    <div>
                                      <div className="text-[11px] text-salon-sub mb-2 font-medium">💳 支付方式明细</div>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {pd.cashPaid > 0 && (
                                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2">
                                            <Banknote size={14} className="text-emerald-600 shrink-0" />
                                            <div className="min-w-0">
                                              <div className="text-[10px] text-emerald-700/70">现金</div>
                                              <div className="text-sm font-semibold text-emerald-700 tabular-nums truncate">{formatCurrency(pd.cashPaid)}</div>
                                            </div>
                                          </div>
                                        )}
                                        {pd.wechatPaid > 0 && (
                                          <div className="p-2.5 rounded-xl bg-green-50 border border-green-100 flex items-center gap-2">
                                            <Smartphone size={14} className="text-green-600 shrink-0" />
                                            <div className="min-w-0">
                                              <div className="text-[10px] text-green-700/70">微信</div>
                                              <div className="text-sm font-semibold text-green-700 tabular-nums truncate">{formatCurrency(pd.wechatPaid)}</div>
                                            </div>
                                          </div>
                                        )}
                                        {pd.alipayPaid > 0 && (
                                          <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 flex items-center gap-2">
                                            <Smartphone size={14} className="text-sky-600 shrink-0" />
                                            <div className="min-w-0">
                                              <div className="text-[10px] text-sky-700/70">支付宝</div>
                                              <div className="text-sm font-semibold text-sky-700 tabular-nums truncate">{formatCurrency(pd.alipayPaid)}</div>
                                            </div>
                                          </div>
                                        )}
                                        {pd.balancePaid > 0 && (
                                          <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-100 flex items-center gap-2">
                                            <PiggyBank size={14} className="text-brand-600 shrink-0" />
                                            <div className="min-w-0">
                                              <div className="text-[10px] text-brand-700/70">余额</div>
                                              <div className="text-sm font-semibold text-brand-700 tabular-nums truncate">{formatCurrency(pd.balancePaid)}</div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-[11px] text-salon-sub flex-wrap pt-1">
                                    {f.transactionId && <span>关联单号：<span className="font-mono text-salon-ink">{f.transactionId}</span></span>}
                                    {f.packageCardId && <span>套餐单号：<span className="font-mono text-salon-ink">{f.packageCardId}</span></span>}
                                    {f.operatorId && <span>员工编号：<span className="font-mono text-salon-ink">{f.operatorId}</span></span>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-8" />
    </div>
  );
};
