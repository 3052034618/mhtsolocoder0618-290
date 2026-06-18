import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wallet, Gift, Check, Search, Users, CreditCard, Sparkles, Clock,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { Modal } from '@/components/Modal';
import { formatCurrency, formatDate } from '@/utils';

export const Recharge: React.FC = () => {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const mid = sp.get('m');
  const tabParam = sp.get('tab');

  const members = useStore(s => s.members);
  const depositTiers = useStore(s => s.depositTiers);
  const packageProducts = useStore(s => s.packageProducts);
  const services = useStore(s => s.serviceItems);
  const addBalance = useStore(s => s.addBalance);
  const addPackageCard = useStore(s => s.addPackageCard);

  const [tab, setTab] = useState<'balance' | 'pkg'>(tabParam === 'pkg' ? 'pkg' : 'balance');
  const [memberId, setMemberId] = useState<string | null>(mid || null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    if (mid) setSp({}, { replace: true });
  }, [mid, setSp]);

  const member = useMemo(() => members.find(m => m.id === memberId) || null, [members, memberId]);

  const memberResults = useMemo(() => {
    if (!search.trim()) return [];
    const kw = search.trim().toLowerCase();
    return members.filter(m => m.name.toLowerCase().includes(kw) || m.phone.includes(kw)).slice(0, 8);
  }, [members, search]);

  const rechargeAmount = selectedTier !== null
    ? depositTiers[selectedTier].amount
    : (customAmount ? Number(customAmount) : 0);
  const rechargeBonus = selectedTier !== null
    ? depositTiers[selectedTier].bonusAmount
    : (rechargeAmount >= 1000 ? Math.floor(rechargeAmount * 0.1) : rechargeAmount >= 500 ? Math.floor(rechargeAmount * 0.08) : rechargeAmount >= 300 ? Math.floor(rechargeAmount * 0.05) : 0);

  const submitBalance = () => {
    if (!member) { toast.show('请先选择会员', 'warning'); return; }
    if (rechargeAmount <= 0) { toast.show('请选择或输入充值金额', 'warning'); return; }
    addBalance(member.id, rechargeAmount, rechargeBonus);
    setSuccessInfo({ type: '储值', text: `¥${rechargeAmount + rechargeBonus}已到账（赠送¥${rechargeBonus}）` });
    setSuccessOpen(true);
    setTimeout(() => { setSuccessOpen(false); setSelectedTier(null); setCustomAmount(''); }, 1800);
  };

  const buyPackage = (pid: string) => {
    if (!member) { toast.show('请先选择会员', 'warning'); return; }
    const prod = packageProducts.find(p => p.id === pid);
    if (!prod) return;
    addPackageCard(member.id, prod, prod.price);
    const svc = services.find(s => s.id === prod.serviceItemId);
    const txRecord: any = {
      memberId: member.id, memberName: member.name,
      items: [{
        serviceItemId: prod.serviceItemId,
        serviceItemName: `${prod.name}购买`,
        price: prod.price,
        quantity: 1,
        employeeId: '', employeeName: '-',
        usePackage: false, commissionAmount: 0,
      }],
      subtotal: prod.price,
      packageDeducted: 0, pointsUsed: 0, pointsEarned: 0,
      balanceUsed: 0, cashPaid: prod.price, wechatPaid: 0, alipayPaid: 0,
      totalPaid: prod.price, createdBy: '',
    };
    setSuccessInfo({
      type: '套餐购买',
      text: `${svc?.name || prod.serviceItemName} ${prod.totalCount + prod.bonusCount}次已激活`,
    });
    setSuccessOpen(true);
    setTimeout(() => setSuccessOpen(false), 1800);
  };

  const selectMember = (m: any) => {
    setMemberId(m.id); setSearchOpen(false); setSearch('');
  };

  return (
    <div className="space-y-5 animate-fade-in-up max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">充值中心</h2>
          <p className="text-sm text-salon-sub mt-1">储值充值和套餐卡购买</p>
        </div>
      </div>

      {/* Member selector */}
      <div className="card p-5">
        <div className="section-title mb-4">
          <Users size={18} className="text-brand-500" />选择充值会员
        </div>
        {!member ? (
          <div>
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
              <input
                className="input pl-11 py-3 text-base"
                placeholder="点击搜索会员姓名或手机号..."
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {searchOpen && (
              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto scrollbar-thin border border-salon-line rounded-2xl p-2">
                {search ? memberResults.map(m => (
                  <button key={m.id} onClick={() => selectMember(m)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50/60 transition-all text-left">
                    <Avatar name={m.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{m.name}</span>
                        <LevelBadge level={m.level} className="!py-0 !px-1.5 !text-[10px]" />
                      </div>
                      <div className="text-xs text-salon-sub">{m.phone}</div>
                    </div>
                    <div className="text-sm font-bold text-brand-600 tabular-nums">{formatCurrency(m.balance)}</div>
                  </button>
                )) : (
                  <div className="py-8 text-center text-sm text-salon-sub">请输入姓名或手机号搜索</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-rose-50 border border-brand-100">
            <Avatar name={member.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-lg">{member.name}</span>
                <LevelBadge level={member.level} />
                <span className="text-xs text-salon-sub">{member.phone}</span>
              </div>
              <div className="flex items-center gap-6 mt-3">
                <div>
                  <div className="text-[11px] text-salon-sub">当前余额</div>
                  <div className="text-xl font-bold text-brand-600 tabular-nums">{formatCurrency(member.balance)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-salon-sub">积分</div>
                  <div className="text-xl font-bold text-rose-500 tabular-nums">{member.points}</div>
                </div>
                <div>
                  <div className="text-[11px] text-salon-sub">到店次数</div>
                  <div className="text-xl font-bold text-salon-green tabular-nums">{member.totalVisits}次</div>
                </div>
              </div>
            </div>
            <button onClick={() => setMemberId(null)} className="text-xs text-salon-sub hover:text-rose-500 underline underline-offset-2">更换会员</button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <div className="border-b border-salon-line flex">
          {[
            { k: 'balance', label: '储值充值', icon: Wallet },
            { k: 'pkg', label: '套餐购买', icon: CreditCard },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all relative
                ${tab === t.k ? 'text-brand-600' : 'text-salon-sub hover:text-salon-ink'}`}
            >
              <t.icon size={16} />{t.label}
              {tab === t.k && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full bg-brand-gradient" />}
            </button>
          ))}
        </div>

        {tab === 'balance' ? (
          <div className="p-6 space-y-6">
            <div>
              <div className="text-xs text-salon-sub mb-3">快捷充值档位（赠送金额）</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {depositTiers.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedTier(i); setCustomAmount(''); }}
                    className={`relative p-4 rounded-2xl text-left transition-all overflow-hidden
                      ${selectedTier === i
                        ? 'border-2 border-brand-400 bg-brand-50/60 shadow-soft'
                        : 'border-2 border-salon-line bg-white hover:border-brand-200 hover:bg-brand-50/30'}`}
                  >
                    {t.bonusAmount > 0 && (
                      <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white text-[10px] font-semibold">
                        <Sparkles size={9} />送{t.bonusAmount}
                      </span>
                    )}
                    <div className="font-display text-2xl font-bold text-brand-600 tabular-nums mt-1">
                      ¥{t.amount}
                    </div>
                    <div className="text-[11px] text-salon-sub mt-1">
                      到账 <span className="font-semibold text-brand-700 tabular-nums">¥{t.amount + t.bonusAmount}</span>
                    </div>
                    {selectedTier === i && (
                      <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-brand-gradient text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs text-salon-sub mb-2">或输入自定义金额</div>
              <div className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-brand-500">¥</span>
                  <input
                    type="number"
                    className="input pl-9 py-3 text-lg font-semibold tabular-nums"
                    placeholder="0.00"
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setSelectedTier(null); }}
                  />
                </div>
                <button onClick={submitBalance} className="btn-primary !px-8 text-base">
                  <Check size={18} />确认充值
                </button>
              </div>
              {(rechargeAmount > 0 || selectedTier !== null) && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-rose-50 border border-brand-100">
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-salon-sub">充值本金</span><span className="tabular-nums">{formatCurrency(rechargeAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-salon-sub">赠送金额</span><span className="tabular-nums text-rose-500">+{formatCurrency(rechargeBonus)}</span></div>
                    <div className="flex justify-between pt-2 mt-1 border-t border-brand-200/60">
                      <span className="font-medium">实际到账</span>
                      <span className="font-display text-2xl font-bold text-brand-600 tabular-nums">{formatCurrency(rechargeAmount + rechargeBonus)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packageProducts.map(p => {
                const svc = services.find(s => s.id === p.serviceItemId);
                const unitPrice = Math.round((p.price / (p.totalCount + p.bonusCount)) * 100) / 100;
                return (
                  <div key={p.id} className="relative rounded-2xl border-2 border-salon-line overflow-hidden hover:border-brand-300 hover:shadow-soft transition-all bg-white group">
                    <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-brand-50/80 to-rose-50/80">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-display font-bold text-lg text-salon-ink">{p.name}</div>
                          <div className="text-[11px] text-salon-sub mt-1">{svc?.category || '服务'} · 有效期{p.validDays}天</div>
                        </div>
                        {p.bonusCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white text-[10px] font-semibold">
                            <Gift size={10} />送{p.bonusCount}次
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="font-display text-3xl font-bold text-brand-600 tabular-nums">¥{p.price}</span>
                        <span className="text-xs text-salon-sub line-through">¥{(svc?.price || 0) * p.totalCount}</span>
                      </div>
                      <div className="text-[11px] text-salon-sub mt-0.5">
                        共{p.totalCount + p.bonusCount}次 · 折合 <span className="text-brand-600 font-semibold tabular-nums">¥{unitPrice}</span>/次
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-salon-sub">
                        <Clock size={12} />
                        <span>{p.serviceItemName} 每次</span>
                      </div>
                      <div className="w-full h-16 rounded-xl bg-salon-bg/70 border border-dashed border-salon-line flex items-center justify-center text-salon-sub text-[11px] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,_rgba(212,168,83,0.25),_transparent_50%)]" />
                        <div className="relative flex items-center gap-1.5">
                          <Sparkles size={11} className="text-brand-500" />
                          剩余 {p.totalCount + p.bonusCount} 次
                        </div>
                      </div>
                      <button
                        onClick={() => buyPackage(p.id)}
                        disabled={!member}
                        className="w-full mt-2 btn-primary !py-2.5 text-sm"
                      >
                        <Check size={15} />立即购买
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-20 h-20 rounded-full bg-brand-gradient text-white flex items-center justify-center mb-5 animate-pulse-soft">
            <Check size={36} strokeWidth={3} />
          </div>
          <h3 className="font-display text-2xl font-bold text-salon-ink mb-2">{successInfo?.type}成功</h3>
          {successInfo && <div className="text-sm text-salon-sub">{successInfo.text}</div>}
        </div>
      </Modal>

      <div className="h-8" />
    </div>
  );
};
