import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, UserPlus, Wallet, Gift, Scissors, Minus, Plus, Trash2,
  Check, X, AlertTriangle, CreditCard, Banknote, Smartphone, Clock,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import type { Member, ServiceItem, TransactionItem } from '@/types';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import {
  formatCurrency, formatDateTime, levelMultiplier, calcCommission, daysBetween,
} from '@/utils';

interface CartItem {
  service: ServiceItem;
  quantity: number;
  employeeId: string;
  employeeName: string;
  usePackage: boolean;
  packageId?: string;
}

const CAT_ICONS: Record<string, string> = { '美发': '💇', '美容': '💆', '美甲': '💅', '其他': '✨' };

export const Cashier: React.FC = () => {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const allMembers = useStore(s => s.members);
  const services = useStore(s => s.serviceItems).filter(s => s.isActive);
  const employees = useStore(s => s.employees).filter(e => e.isActive);
  const allPackages = useStore(s => s.packageCards);
  const currentEmp = useStore(s => s.getCurrentEmployee());
  const addTransaction = useStore(s => s.addTransaction);
  const addMember = useStore(s => s.addMember);

  const [search, setSearch] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [usePoints, setUsePoints] = useState(false);
  const [payMethods, setPayMethods] = useState({ balance: false, cash: false, wechat: true, alipay: false });
  const [customBalance, setCustomBalance] = useState<number | null>(null);
  const [customCash, setCustomCash] = useState<number | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ amount: number; points: number } | null>(null);

  // Init member from URL
  useEffect(() => {
    const mid = sp.get('m');
    if (mid) {
      const m = allMembers.find(x => x.id === mid);
      if (m) { setMember(m); setSearch(m.name); }
      setSp({}, { replace: true });
    }
  }, [sp, allMembers, setSp]);

  // Member search
  useEffect(() => {
    if (!search.trim()) { setMemberSearchResults([]); return; }
    const kw = search.trim().toLowerCase();
    const r = allMembers.filter(m =>
      m.name.toLowerCase().includes(kw) || m.phone.includes(kw),
    ).slice(0, 8);
    setMemberSearchResults(r);
  }, [search, allMembers]);

  // Auto select preferred stylist for member
  const preferredEmp = member?.preferredStylistId
    ? employees.find(e => e.id === member.preferredStylistId)
    : null;
  const defaultEmp = preferredEmp || employees[0];

  const memberPkgs = useMemo(() => {
    if (!member) return [];
    return allPackages.filter(p =>
      p.memberId === member.id && p.usedCount < p.totalCount && dayjs(p.expireDate).isAfter(dayjs()),
    );
  }, [member, allPackages]);

  const addToCart = (s: ServiceItem) => {
    // Find available package
    const pkg = memberPkgs.find(p => p.serviceItemId === s.id);
    const exist = cart.find(c => c.service.id === s.id && !c.usePackage);
    if (exist) {
      setCart(cart.map(c => c === exist ? { ...c, quantity: c.quantity + 1 } : c));
      return;
    }
    setCart([...cart, {
      service: s,
      quantity: 1,
      employeeId: defaultEmp?.id || '',
      employeeName: defaultEmp?.name || '',
      usePackage: !!pkg,
      packageId: pkg?.id,
    }]);
    // Consume package if possible
    if (pkg) {
      toast.show(`已匹配套餐：剩余${pkg.totalCount - pkg.usedCount - 1}次`, 'info');
    }
  };

  const updateCart = (idx: number, patch: Partial<CartItem>) => {
    setCart(cart.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  const removeCart = (idx: number) => setCart(cart.filter((_, i) => i !== idx));

  // Totals
  const { subtotal, packageDeduct, payable, pointsUsed, maxPointsUsed } = useMemo(() => {
    const subtotal = cart.reduce((s, c) => s + c.service.price * c.quantity, 0);
    const packageDeduct = cart.reduce((s, c) => c.usePackage ? s + c.service.price * c.quantity : s, 0);
    const cashPart = subtotal - packageDeduct;
    const maxPoints = member && usePoints
      ? Math.min(member.points, Math.floor(cashPart * 0.2 * 100))
      : 0;
    const pointsUsed = member && usePoints ? maxPoints : 0;
    const payable = Math.max(0, cashPart - pointsUsed / 100);
    return { subtotal, packageDeduct, payable, pointsUsed, maxPointsUsed: maxPoints };
  }, [cart, member, usePoints]);

  // Determine balance use
  const balancePaid = useMemo(() => {
    if (!member || !payMethods.balance || !member) return 0;
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
  const canPay = cart.length > 0 && member && Math.abs(payDiff) < 0.01 && cart.every(c => c.employeeId);
  const pointsEarned = member
    ? Math.round(balancePaid * levelMultiplier(member.level))
    : 0;

  const quickAddMember = () => {
    if (!/^1\d{10}$/.test(search.trim())) {
      toast.show('请先在搜索框输入完整的11位手机号以快速建档', 'warning');
      return;
    }
    const created = addMember({
      name: '新顾客' + search.slice(-4),
      phone: search.trim(),
      gender: '女',
      birthday: '',
      preferredStylistId: undefined,
      allergies: [],
      remark: '',
    });
    setMember(created);
    setSearch(created.name);
    setMemberSearchResults([]);
    toast.show('快速建档成功');
  };

  const confirmPay = () => {
    if (!canPay || !member) return;

    // Build transaction items
    const items: TransactionItem[] = cart.map(c => {
      const actualAmount = c.usePackage ? 0 : c.service.price * c.quantity;
      return {
        serviceItemId: c.service.id,
        serviceItemName: c.service.name,
        price: c.service.price,
        quantity: c.quantity,
        employeeId: c.employeeId,
        employeeName: c.employeeName,
        usePackage: c.usePackage,
        packageId: c.packageId,
        commissionAmount: c.usePackage
          ? Math.round(c.service.price * c.quantity * 0.1 * 100) / 100
          : calcCommission(c.service, c.quantity, actualAmount),
      };
    });

    // Build package deductions
    const deductions: { packageCardId: string; count: number }[] = [];
    cart.forEach(c => {
      if (c.usePackage && c.packageId) {
        const d = deductions.find(x => x.packageCardId === c.packageId);
        if (d) d.count += c.quantity;
        else deductions.push({ packageCardId: c.packageId, count: c.quantity });
      }
    });

    addTransaction({
      memberId: member.id,
      memberName: member.name,
      items,
      subtotal,
      packageDeducted: packageDeduct,
      pointsUsed,
      pointsEarned,
      balanceUsed: balancePaid,
      cashPaid,
      wechatPaid,
      alipayPaid,
      totalPaid: subtotal - packageDeduct - pointsUsed / 100,
      createdBy: currentEmp?.id || employees[0]?.id || '',
    }, {
      memberId: member.id,
      balanceUsed: balancePaid,
      pointsUsed,
      pointsEarned,
      totalPaid: Math.round((subtotal - packageDeduct) * 100) / 100,
    }, deductions);

    setSuccessInfo({ amount: subtotal - packageDeduct - pointsUsed / 100, points: pointsEarned });
    setSuccessOpen(true);

    setTimeout(() => {
      setSuccessOpen(false);
      setCart([]);
      setUsePoints(false);
      setCustomBalance(null);
      setCustomCash(null);
      setMember(null);
      setSearch('');
    }, 2000);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">消费收银台</h2>
          <p className="text-sm text-salon-sub mt-1">
            快速开单 · 自动扣次 · 积分累计
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-salon-sub">
          <Clock size={14} />{formatDateTime(new Date().toISOString())}
          <span className="mx-2">·</span>
          操作人：<span className="font-medium text-salon-ink">{currentEmp?.name || '-'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Left: Member + services */}
        <div className="xl:col-span-7 space-y-5">
          {/* Member finder */}
          <div className="card p-5">
            <div className="section-title mb-4">
              <Scissors size={18} className="text-brand-500" />选择会员
            </div>

            {!member ? (
              <div className="space-y-4">
                <div className="flex gap-2 relative">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
                    <input
                      className="input pl-11 text-base py-3"
                      placeholder="输入手机号或姓名快速查找..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={quickAddMember}
                    className="btn-primary shrink-0"
                    title="使用搜索框中的手机号快速建档"
                  >
                    <UserPlus size={18} />新会员建档
                  </button>
                </div>

                {memberSearchResults.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
                    {memberSearchResults.map(m => {
                      const away = daysBetween(m.lastVisitDate);
                      return (
                        <button
                          key={m.id}
                          onClick={() => { setMember(m); setMemberSearchResults([]); setSearch(m.name); }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-salon-line hover:bg-brand-50/60 hover:border-brand-200 transition-all text-left group"
                        >
                          <Avatar name={m.name} size="md" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{m.name}</span>
                              <LevelBadge level={m.level} className="!py-0 !px-1.5 !text-[10px]" />
                              {m.isAtRisk && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 font-medium">
                                  <AlertTriangle size={10} />流失
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-salon-sub mt-0.5">{m.phone}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-brand-600 tabular-nums">{formatCurrency(m.balance)}</div>
                            <div className="text-[10px] text-salon-sub">{away > 0 ? `${away}天未到店` : '活跃'}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : search ? (
                  <div className="py-10 text-center">
                    <div className="text-sm text-salon-sub mb-3">未找到匹配会员</div>
                    {/^1\d{10}$/.test(search.trim()) && (
                      <button onClick={quickAddMember} className="btn-primary">
                        <UserPlus size={16} />以 {search} 快速建档
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                    {allMembers.slice(0, 6).map(m => (
                      <button key={m.id}
                        onClick={() => { setMember(m); setSearch(m.name); setMemberSearchResults([]); }}
                        className="flex items-center gap-2 p-2.5 rounded-xl border border-salon-line hover:bg-brand-50/60 hover:border-brand-200 transition-all text-left">
                        <Avatar name={m.name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{m.name}</div>
                          <div className="text-[10px] text-salon-sub truncate">{m.phone}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-brand-50 to-rose-50 border border-brand-100">
                  <Avatar name={member.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg">{member.name}</span>
                      <LevelBadge level={member.level} />
                      <span className="text-xs text-salon-sub">{member.phone}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-salon-sub">余额</span>
                        <div className="text-brand-600 font-bold text-base tabular-nums">{formatCurrency(member.balance)}</div>
                      </div>
                      <div>
                        <span className="text-salon-sub">积分</span>
                        <div className="text-rose-500 font-bold text-base tabular-nums">{member.points}</div>
                      </div>
                      <div>
                        <span className="text-salon-sub">到店</span>
                        <div className="text-salon-green font-bold text-base tabular-nums">{member.totalVisits}次</div>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setMember(null); setSearch(''); setCart([]); }}
                    className="w-8 h-8 rounded-lg hover:bg-white/70 text-salon-sub flex items-center justify-center">
                    <X size={16} />
                  </button>
                </div>

                {memberPkgs.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-salon-sub mb-2">🎁 可用套餐（优先扣次）</div>
                    <div className="flex flex-wrap gap-2">
                      {memberPkgs.map(p => (
                        <span key={p.id} className="chip">
                          {p.serviceItemName} · 剩{p.totalCount - p.usedCount}次
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Services */}
          <div className="card p-5">
            <div className="section-title mb-4">
              <Scissors size={18} className="text-brand-500" />选择服务项目
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => addToCart(s)}
                  className="relative text-left p-4 rounded-2xl border-2 border-transparent bg-salon-bg/60
                    hover:bg-white hover:border-brand-200 hover:shadow-soft transition-all group overflow-hidden"
                >
                  <div className="text-2xl mb-2">{CAT_ICONS[s.category] || '✨'}</div>
                  <div className="text-sm font-semibold text-salon-ink truncate">{s.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-salon-sub">{s.duration}分钟</span>
                    <span className="text-brand-600 font-bold tabular-nums">{formatCurrency(s.price)}</span>
                  </div>
                  <div className="absolute -right-3 -bottom-3 w-14 h-14 rounded-full bg-brand-gradient opacity-0 group-hover:opacity-10 transition-all" />
                  <Plus size={18} className="absolute right-3 top-3 text-brand-400 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart + Pay */}
        <div className="xl:col-span-5 flex flex-col gap-5 min-h-[600px]">
          <div className="card p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="section-title">
                <CreditCard size={18} className="text-brand-500" />当前订单
              </div>
              <span className="text-xs text-salon-sub">{cart.length}项服务</span>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-salon-sub text-sm py-10">
                <Scissors size={40} className="text-brand-200 mb-3" />
                请从左侧选择服务项目
              </div>
            ) : (
              <>
                <div className="space-y-3 flex-1 overflow-y-auto scrollbar-thin pr-1">
                  {cart.map((c, idx) => {
                    const pkg = c.packageId ? memberPkgs.find(p => p.id === c.packageId) : null;
                    return (
                      <div key={idx} className="p-3 rounded-2xl bg-salon-bg/60 border border-salon-line/60">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-lg shadow-card shrink-0">
                            {CAT_ICONS[c.service.category] || '✨'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-sm truncate">{c.service.name}</div>
                              <button onClick={() => removeCart(idx)}
                                className="w-7 h-7 rounded-lg hover:bg-rose-50 text-salon-sub hover:text-rose-500 shrink-0 flex items-center justify-center">
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <div className="mt-1">
                              <select
                                className="input input-sm !py-1 text-[11px] w-full mb-2"
                                value={c.employeeId}
                                onChange={e => {
                                  const emp = employees.find(x => x.id === e.target.value);
                                  updateCart(idx, { employeeId: e.target.value, employeeName: emp?.name || '' });
                                }}
                              >
                                <option value="">选择服务员工</option>
                                {employees.map(e => (
                                  <option key={e.id} value={e.id}>{e.name} · {e.position}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <button onClick={() => updateCart(idx, { quantity: Math.max(1, c.quantity - 1) })}
                                  className="w-7 h-7 rounded-lg bg-white border border-salon-line text-salon-ink hover:border-brand-300 flex items-center justify-center">
                                  <Minus size={12} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold tabular-nums">{c.quantity}</span>
                                <button onClick={() => updateCart(idx, { quantity: c.quantity + 1 })}
                                  className="w-7 h-7 rounded-lg bg-white border border-salon-line text-salon-ink hover:border-brand-300 flex items-center justify-center">
                                  <Plus size={12} />
                                </button>
                              </div>
                              <div className="text-right">
                                {c.usePackage ? (
                                  <span className="text-sm font-semibold text-amber-600">套餐扣次{c.packageId && pkg
                                    ? ` 剩${pkg.totalCount - pkg.usedCount - c.quantity}次`
                                    : ''}</span>
                                ) : (
                                  <span className="text-sm font-bold text-brand-600 tabular-nums">
                                    {formatCurrency(c.service.price * c.quantity)}
                                  </span>
                                )}
                              </div>
                            </div>
                            {memberPkgs.find(p => p.serviceItemId === c.service.id) && (
                              <button
                                onClick={() => {
                                  const p = memberPkgs.find(pp => pp.serviceItemId === c.service.id);
                                  updateCart(idx, { usePackage: !c.usePackage, packageId: c.usePackage ? undefined : p?.id });
                                }}
                                className={`mt-2 w-full text-[11px] py-1 rounded-lg border transition-all
                                  ${c.usePackage
                                    ? 'bg-amber-50 text-amber-600 border-amber-200 font-medium'
                                    : 'border-dashed border-salon-line text-salon-sub hover:border-amber-300 hover:text-amber-600'}`}
                              >
                                {c.usePackage ? '✓ 已使用套餐' : '使用套餐扣次'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-4 border-t border-salon-line space-y-2.5">
                  <div className="flex justify-between text-sm text-salon-sub">
                    <span>项目小计</span>
                    <span className="tabular-nums text-salon-ink font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {packageDeduct > 0 && (
                    <div className="flex justify-between text-sm text-amber-600">
                      <span>套餐抵扣</span>
                      <span className="tabular-nums font-medium">-{formatCurrency(packageDeduct)}</span>
                    </div>
                  )}
                  {member && (
                    <label className="flex items-center justify-between cursor-pointer pt-1">
                      <span className="flex items-center gap-2 text-sm text-salon-sub">
                        <Gift size={14} className="text-rose-400" />
                        积分抵扣 <span className="text-[10px]">(可用{member.points}，抵扣{maxPointsUsed / 100}元)</span>
                      </span>
                      <div className={`w-10 h-5 rounded-full transition-all relative cursor-pointer
                        ${usePoints ? 'bg-brand-gradient' : 'bg-salon-line'}`}
                        onClick={() => setUsePoints(!usePoints)}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all
                          ${usePoints ? 'left-[22px]' : 'left-0.5'}`} />
                      </div>
                    </label>
                  )}
                  {pointsUsed > 0 && (
                    <div className="flex justify-between text-sm text-rose-500">
                      <span>积分抵扣 ({pointsUsed}分)</span>
                      <span className="tabular-nums font-medium">-{formatCurrency(pointsUsed / 100)}</span>
                    </div>
                  )}
                  <div className="flex items-end justify-between pt-2">
                    <span className="text-salon-sub text-sm">应付金额</span>
                    <span className="font-display text-3xl font-bold text-brand-600 tabular-nums">
                      {formatCurrency(payable)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Payment */}
          <div className="card p-5">
            <div className="section-title mb-4">支付方式</div>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {[
                { key: 'balance', label: '余额支付', icon: Wallet, enable: !!member && member.balance > 0, amt: balancePaid },
                { key: 'cash', label: '现金', icon: Banknote, enable: true, amt: cashPaid },
                { key: 'wechat', label: '微信支付', icon: Smartphone, enable: true, amt: wechatPaid },
                { key: 'alipay', label: '支付宝', icon: CreditCard, enable: true, amt: alipayPaid },
              ].map(p => {
                const en = p.enable;
                const active = payMethods[p.key as keyof typeof payMethods];
                const showInput = active && ['balance', 'cash'].includes(p.key);
                return (
                  <div key={p.key}>
                    <button
                      disabled={!en}
                      onClick={() => setPayMethods(m => ({ ...m, [p.key]: !active }))}
                      className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-2
                        ${active ? 'border-brand-400 bg-brand-50/60' : en
                          ? 'border-salon-line hover:border-brand-200 bg-white'
                          : 'border-salon-line/40 bg-salon-bg/40 opacity-60 cursor-not-allowed'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                        ${active ? 'bg-brand-gradient text-white' : 'bg-salon-bg text-salon-sub'}`}>
                        <p.icon size={15} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs font-semibold text-salon-ink truncate">{p.label}</div>
                        <div className={`text-[11px] tabular-nums ${active ? 'text-brand-600 font-medium' : 'text-salon-sub'}`}>
                          {p.amt > 0 ? formatCurrency(p.amt) : (en ? '点击选择' : '余额不足')}
                        </div>
                      </div>
                      {active && <Check size={15} className="text-brand-500" />}
                    </button>
                    {showInput && active && (
                      <div className="mt-2 px-1">
                        <input
                          type="number"
                          className="input input-sm"
                          placeholder={`输入${p.label === '余额支付' ? '使用' : '收取'}金额`}
                          value={(p.key === 'balance' ? customBalance : customCash) ?? ''}
                          onChange={e => {
                            const v = e.target.value === '' ? null : Number(e.target.value);
                            if (p.key === 'balance') setCustomBalance(v); else setCustomCash(v);
                          }}
                          onBlur={() => {
                            if (p.key === 'balance' && customBalance === null) setCustomBalance(payable);
                            if (p.key === 'cash' && customCash === null) setCustomCash(remainAfterBalance);
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-salon-bg/60 text-xs">
              {balancePaid > 0 && <div className="flex justify-between"><span className="text-salon-sub">余额支付</span><span className="tabular-nums">{formatCurrency(balancePaid)}</span></div>}
              {cashPaid > 0 && <div className="flex justify-between"><span className="text-salon-sub">现金</span><span className="tabular-nums">{formatCurrency(cashPaid)}</span></div>}
              {wechatPaid > 0 && <div className="flex justify-between"><span className="text-salon-sub">微信支付</span><span className="tabular-nums">{formatCurrency(wechatPaid)}</span></div>}
              {alipayPaid > 0 && <div className="flex justify-between"><span className="text-salon-sub">支付宝</span><span className="tabular-nums">{formatCurrency(alipayPaid)}</span></div>}
              <div className="flex justify-between pt-2 mt-1 border-t border-salon-line">
                <span className="text-salon-sub">合计实收</span>
                <span className="font-bold tabular-nums text-salon-ink">{formatCurrency(totalPaid)}</span>
              </div>
              {Math.abs(payDiff) > 0.001 && payable > 0 && (
                <div className={`flex justify-between ${payDiff > 0 ? 'text-rose-500' : 'text-brand-600'}`}>
                  <span>差额</span>
                  <span className="tabular-nums font-medium">{payDiff > 0 ? '还需' : '多付'} {formatCurrency(Math.abs(payDiff))}</span>
                </div>
              )}
            </div>

            <button
              disabled={!canPay}
              onClick={confirmPay}
              className="w-full btn-primary !py-4 text-base"
            >
              <Check size={18} />
              确认收款 {cart.length > 0 && `(${formatCurrency(payable)})`}
            </button>
            {!member && cart.length > 0 && (
              <div className="text-center mt-2 text-[11px] text-rose-500">请先选择会员</div>
            )}
          </div>
        </div>
      </div>

      {/* Success modal */}
      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} size="sm">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-20 h-20 rounded-full bg-brand-gradient text-white flex items-center justify-center mb-5 animate-pulse-soft">
            <Check size={36} strokeWidth={3} />
          </div>
          <h3 className="font-display text-2xl font-bold text-salon-ink mb-1">收款成功</h3>
          {successInfo && (
            <>
              <div className="font-display text-3xl font-bold text-brand-600 tabular-nums mt-4">
                {formatCurrency(successInfo.amount)}
              </div>
              {successInfo.points > 0 && (
                <div className="mt-2 chip">
                  <Gift size={12} />获得 {successInfo.points} 积分
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      <button onClick={() => nav('/members/new')} className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-brand-gradient text-white shadow-soft hover:shadow-glow transition-all flex items-center justify-center animate-pulse-soft z-40">
        <UserPlus size={22} />
      </button>
    </div>
  );
};
