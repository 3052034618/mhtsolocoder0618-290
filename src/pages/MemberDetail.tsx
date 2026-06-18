import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Edit3, CreditCard, Wallet, Gift, MessageSquare, AlertTriangle,
  Calendar, Clock, Scissors, TrendingUp, User, Phone,
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

export const MemberDetail: React.FC = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const m = useStore(s => s.members.find(x => x.id === id));
  const txs = useStore(s => s.transactions.filter(t => t.memberId === id));
  const pkgs = useStore(s => s.packageCards.filter(p => p.memberId === id));
  const coupons = useStore(s => s.coupons.filter(c => c.memberId === id));
  const employees = useStore(s => s.employees);
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

      {/* Packages & Coupons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title"><Gift size={16} className="text-brand-500" />套餐卡（{validPkgs.length}）</div>
            <button onClick={() => nav(`/recharge?m=${m.id}&tab=pkg`)} className="btn-soft text-xs py-1.5">
              购买套餐
            </button>
          </div>
          {validPkgs.length === 0 ? (
            <div className="py-8 text-center text-sm text-salon-sub">暂无在用套餐</div>
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

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="section-title"><Gift size={16} className="text-rose-400" />优惠券（{coupons.filter(c => !c.isUsed).length}）</div>
          </div>
          {coupons.filter(c => !c.isUsed).length === 0 ? (
            <div className="py-8 text-center text-sm text-salon-sub">暂无可用优惠券</div>
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

      {/* Transaction history */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="section-title"><Clock size={16} className="text-brand-500" />消费记录（{txs.length}）</div>
          <span className="text-xs text-salon-sub">累计实付 {formatCurrency(txs.reduce((s, t) => s + t.totalPaid, 0))}</span>
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
                  {(t.balanceUsed > 0 || t.pointsUsed > 0 || t.packageDeducted > 0) && (
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
      <div className="h-8" />
    </div>
  );
};
