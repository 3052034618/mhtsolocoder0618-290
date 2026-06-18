import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Wallet, Gift, Check, Search, Users, CreditCard, Sparkles, Clock,
  Banknote, Smartphone, Minus, X as XIcon,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { Modal } from '@/components/Modal';
import type { PackageProduct } from '@/types';
import { formatCurrency, formatDate, levelMultiplier } from '@/utils';

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
  const currentEmp = useStore(s => s.currentUser);

  const [tab, setTab] = useState<'balance' | 'pkg'>(tabParam === 'pkg' ? 'pkg' : 'balance');
  const [memberId, setMemberId] = useState<string | null>(mid || null);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ type: string; text: string } | null>(null);

  // 支付方式
  const [payMethods, setPayMethods] = useState<Record<string, boolean>>({ cash: true });
  const [customBalance, setCustomBalance] = useState<number | null>(null);
  const [customCash, setCustomCash] = useState<number | null>(null);

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

  const selectedPkg: PackageProduct | null = useMemo(
    () => packageProducts.find(p => p.id === selectedPkgId) || null,
    [packageProducts, selectedPkgId],
  );

  // 应付金额（根据tab和当前选中）
  const payable = tab === 'balance' ? rechargeAmount : (selectedPkg?.price || 0);

  // 组合支付计算（和Cashier逻辑一致）
  const balancePaid = useMemo(() => {
    if (!member || !payMethods.balance) return 0;
    const max = member.balance;
    if (customBalance !== null) return Math.min(Math.max(0, customBalance), Math.min(max, payable));
    return Math.min(max, payable);
  }, [payMethods.balance, member, payable, customBalance]);

  const remainAfterBalance = payable - balancePaid;

  const cashPaid = useMemo(() => {
    if (!payMethods.cash) return 0;
    if (customCash !== null) return Math.max(0, customCash);
    if (payMethods.wechat || payMethods.alipay) return 0;
    return Math.max(0, remainAfterBalance);
  }, [payMethods, customCash, remainAfterBalance]);

  const wechatPaid = useMemo(() => {
    if (!payMethods.wechat) return 0;
    const rest = remainAfterBalance - cashPaid;
    if (payMethods.alipay) return Math.max(0, Math.round(rest / 2 * 100) / 100);
    return Math.max(0, rest);
  }, [payMethods.wechat, payMethods.alipay, remainAfterBalance, cashPaid]);

  const alipayPaid = useMemo(() => {
    if (!payMethods.alipay) return 0;
    const rest = remainAfterBalance - cashPaid - wechatPaid;
    return Math.max(0, Math.round(rest * 100) / 100);
  }, [payMethods.alipay, remainAfterBalance, cashPaid, wechatPaid]);

  const totalPaid = balancePaid + cashPaid + wechatPaid + alipayPaid;
  const payDiff = payable - totalPaid;
  const canPay = payable > 0 && member && Math.abs(payDiff) < 0.01 && Object.values(payMethods).some(Boolean);

  const operatorId = currentEmp?.id || '';
  const operatorName = currentEmp?.name || '-';

  const submitBalance = () => {
    if (!member) { toast.show('请先选择会员', 'warning'); return; }
    if (rechargeAmount <= 0) { toast.show('请选择或输入充值金额', 'warning'); return; }
    if (!canPay) { toast.show(`请选择支付方式并匹配金额（差额${payDiff.toFixed(2)}元）`, 'warning'); return; }
    const pd = { balancePaid, cashPaid, wechatPaid, alipayPaid };
    addBalance(member.id, rechargeAmount, rechargeBonus, pd, operatorId, operatorName);
    setSuccessInfo({
      type: '储值充值',
      text: `¥${rechargeAmount + rechargeBonus} 已到账（赠送¥${rechargeBonus}）`,
    });
    setSuccessOpen(true);
    setTimeout(() => {
      setSuccessOpen(false);
      setSelectedTier(null);
      setCustomAmount('');
      setPayMethods({ cash: true });
      setCustomBalance(null);
      setCustomCash(null);
    }, 1800);
  };

  const buyPackage = () => {
    if (!member) { toast.show('请先选择会员', 'warning'); return; }
    if (!selectedPkg) { toast.show('请选择要购买的套餐', 'warning'); return; }
    if (!canPay) { toast.show(`请选择支付方式并匹配金额（差额${payDiff.toFixed(2)}元）`, 'warning'); return; }
    const pd = { balancePaid, cashPaid, wechatPaid, alipayPaid };
    const { card } = addPackageCard(member.id, selectedPkg, selectedPkg.price, pd, operatorId, operatorName);
    const svc = services.find(s => s.id === selectedPkg.serviceItemId);
    const earn = Math.floor(selectedPkg.price / 10 * levelMultiplier(member.level));
    setSuccessInfo({
      type: '套餐购买',
      text: `${svc?.name || selectedPkg.serviceItemName} ${card.totalCount}次已激活（+${earn}积分）`,
    });
    setSuccessOpen(true);
    setTimeout(() => {
      setSuccessOpen(false);
      setSelectedPkgId(null);
      setPayMethods({ cash: true });
      setCustomBalance(null);
      setCustomCash(null);
    }, 1800);
  };

  const selectMember = (m: any) => {
    setMemberId(m.id); setSearchOpen(false); setSearch('');
  };

  const togglePay = (k: string) => {
    setPayMethods(p => {
      const np = { ...p, [k]: !p[k] };
      // 至少一个支付方式
      if (!Object.values(np).some(Boolean)) return p;
      return np;
    });
  };

  const PaymentPanel = () => (
    <div className="card p-5 mt-5 border-2 border-brand-100/60 bg-gradient-to-br from-brand-50/40 to-rose-50/40">
      <div className="section-title mb-4">
        <CreditCard size={17} className="text-brand-500" />支付方式（支持组合）
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 余额支付 */}
        <button
          onClick={() => member && member.balance > 0 && togglePay('balance')}
          disabled={!member || member.balance <= 0}
          className={`p-3 rounded-xl border-2 text-left transition-all
            ${payMethods.balance
              ? 'border-brand-500 bg-brand-50 shadow-soft'
              : member && member.balance > 0
                ? 'border-salon-line bg-white hover:border-brand-200'
                : 'border-salon-line bg-salon-bg/40 opacity-50 cursor-not-allowed'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={15} className="text-brand-600" />
            <span className="text-sm font-medium">余额支付</span>
          </div>
          <div className="text-xs text-salon-sub">
            可用 <span className="font-bold text-brand-600 tabular-nums">{member ? formatCurrency(member.balance) : '¥0.00'}</span>
          </div>
          {payMethods.balance && (
            <div className="mt-2">
              <input
                type="number"
                className="input !py-1.5 !px-2 text-xs tabular-nums"
                value={customBalance === null ? balancePaid : customBalance}
                onClick={e => e.stopPropagation()}
                onChange={e => setCustomBalance(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
          )}
        </button>

        {/* 现金 */}
        <button
          onClick={() => togglePay('cash')}
          className={`p-3 rounded-xl border-2 text-left transition-all
            ${payMethods.cash ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-salon-line bg-white hover:border-brand-200'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Banknote size={15} className="text-emerald-600" />
            <span className="text-sm font-medium">现金</span>
          </div>
          <div className="text-xs text-salon-sub tabular-nums">
            实收 {formatCurrency(payMethods.cash ? cashPaid : 0)}
          </div>
          {payMethods.cash && (
            <div className="mt-2">
              <input
                type="number"
                className="input !py-1.5 !px-2 text-xs tabular-nums"
                value={customCash === null ? cashPaid : customCash}
                onClick={e => e.stopPropagation()}
                onChange={e => setCustomCash(e.target.value ? Number(e.target.value) : 0)}
              />
            </div>
          )}
        </button>

        {/* 微信 */}
        <button
          onClick={() => togglePay('wechat')}
          className={`p-3 rounded-xl border-2 text-left transition-all
            ${payMethods.wechat ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-salon-line bg-white hover:border-brand-200'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Smartphone size={15} className="text-emerald-500" />
            <span className="text-sm font-medium">微信支付</span>
          </div>
          <div className="text-xs text-salon-sub tabular-nums">
            应收 {formatCurrency(payMethods.wechat ? wechatPaid : 0)}
          </div>
        </button>

        {/* 支付宝 */}
        <button
          onClick={() => togglePay('alipay')}
          className={`p-3 rounded-xl border-2 text-left transition-all
            ${payMethods.alipay ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-salon-line bg-white hover:border-brand-200'}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={15} className="text-sky-500" />
            <span className="text-sm font-medium">支付宝</span>
          </div>
          <div className="text-xs text-salon-sub tabular-nums">
            应收 {formatCurrency(payMethods.alipay ? alipayPaid : 0)}
          </div>
        </button>
      </div>

      {/* 结算汇总 */}
      <div className="mt-4 pt-4 border-t border-dashed border-brand-200/70 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <div className="text-[11px] text-salon-sub mb-1">应付金额</div>
          <div className="font-display text-2xl font-bold text-brand-600 tabular-nums">{formatCurrency(payable)}</div>
        </div>
        <div className="md:col-span-2 space-y-1 text-xs pl-4 border-l border-salon-line">
          {balancePaid > 0 && <div className="flex justify-between tabular-nums"><span className="text-salon-sub">余额抵扣</span><span>-{formatCurrency(balancePaid)}</span></div>}
          {cashPaid > 0 && <div className="flex justify-between tabular-nums"><span className="text-salon-sub">现金</span><span>{formatCurrency(cashPaid)}</span></div>}
          {wechatPaid > 0 && <div className="flex justify-between tabular-nums"><span className="text-salon-sub">微信</span><span>{formatCurrency(wechatPaid)}</span></div>}
          {alipayPaid > 0 && <div className="flex justify-between tabular-nums"><span className="text-salon-sub">支付宝</span><span>{formatCurrency(alipayPaid)}</span></div>}
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="flex-1 text-right">
            <div className="text-[11px] text-salon-sub mb-1">差额</div>
            <div className={`text-lg font-bold tabular-nums ${Math.abs(payDiff) < 0.01 ? 'text-salon-green' : 'text-rose-500'}`}>
              {Math.abs(payDiff) < 0.01 ? '✓ 已匹配' : `差 ${formatCurrency(payDiff)}`}
            </div>
          </div>
          <button
            onClick={tab === 'balance' ? submitBalance : buyPackage}
            disabled={!canPay}
            className="btn-primary !px-6 text-base shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={18} />确认{tab === 'balance' ? '充值' : '购买'}
          </button>
        </div>
      </div>
    </div>
  );

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
            <button onClick={() => { setMemberId(null); setSelectedPkgId(null); }} className="text-xs text-salon-sub hover:text-rose-500 underline underline-offset-2">更换会员</button>
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
              onClick={() => { setTab(t.k as any); setSelectedPkgId(null); setPayMethods({ cash: true }); setCustomCash(null); setCustomBalance(null); }}
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
                    <div className="font-display text-2xl font-bold text-brand-600 tabular-nums mt-1">¥{t.amount}</div>
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
              </div>
              {(rechargeAmount > 0 || selectedTier !== null) && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-rose-50 border border-brand-100 max-w-lg">
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
                const isSel = selectedPkgId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPkgId(isSel ? null : p.id)}
                    className={`relative rounded-2xl overflow-hidden transition-all text-left group
                      ${isSel
                        ? 'border-2 border-brand-500 shadow-soft ring-4 ring-brand-100'
                        : 'border-2 border-salon-line hover:border-brand-300 hover:shadow-soft bg-white'}`}
                  >
                    <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-brand-50/80 to-rose-50/80 relative">
                      {isSel && (
                        <div className="absolute top-3 left-3 z-10 w-6 h-6 rounded-full bg-brand-gradient text-white flex items-center justify-center shadow-soft">
                          <Check size={14} />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className={isSel ? 'pl-8' : ''}>
                          <div className="font-display font-bold text-lg text-salon-ink">{p.name}</div>
                          <div className="text-[11px] text-salon-sub mt-1">{svc?.category || '服务'} · 有效期{p.validDays}天</div>
                        </div>
                        {p.bonusCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-gradient-to-r from-rose-400 to-rose-500 text-white text-[10px] font-semibold">
                            <Gift size={10} />送{p.bonusCount}次
                          </span>
                        )}
                      </div>
                      <div className={`mt-4 flex items-baseline gap-2 ${isSel ? 'pl-8' : ''}`}>
                        <span className="font-display text-3xl font-bold text-brand-600 tabular-nums">¥{p.price}</span>
                        <span className="text-xs text-salon-sub line-through">¥{(svc?.price || 0) * p.totalCount}</span>
                      </div>
                      <div className={`text-[11px] text-salon-sub mt-0.5 ${isSel ? 'pl-8' : ''}`}>
                        共{p.totalCount + p.bonusCount}次 · 折合 <span className="text-brand-600 font-semibold tabular-nums">¥{unitPrice}</span>/次
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-salon-sub">
                        <Clock size={12} />
                        <span>{p.serviceItemName} 每次</span>
                      </div>
                      <div className="w-full h-14 rounded-xl bg-salon-bg/70 border border-dashed border-salon-line flex items-center justify-center text-salon-sub text-[11px] relative overflow-hidden">
                        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_40%,_rgba(212,168,83,0.25),_transparent_50%)]" />
                        <div className="relative flex items-center gap-1.5">
                          <Sparkles size={11} className="text-brand-500" />
                          剩余 {p.totalCount + p.bonusCount} 次
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 组合支付面板 */}
      <PaymentPanel />

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
