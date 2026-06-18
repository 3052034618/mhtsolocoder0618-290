import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Scissors, Tag, Plus, Edit3, Trash2, Check,
  Palette, Bell, Database, RefreshCw,
} from 'lucide-react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { Empty } from '@/components/Empty';
import { formatCurrency } from '@/utils';
import type { ServiceItem } from '@/types';

const categoryOptions = [
  { k: '美发', emoji: '💇' },
  { k: '美容', emoji: '💆' },
  { k: '美甲', emoji: '💅' },
  { k: '护肤', emoji: '🧴' },
  { k: 'SPA', emoji: '🛁' },
  { k: '其他', emoji: '✨' },
];

export const Settings: React.FC = () => {
  const toast = useToast();
  const services = useStore(s => s.serviceItems);
  const addService = useStore(s => s.addService);
  const updateService = useStore(s => s.updateService);
  const deleteService = useStore(s => s.deleteService);
  const depositTiers = useStore(s => s.depositTiers);
  const setDepositTiers = useStore(s => s.setDepositTiers);
  const resetData = useStore(s => s.initData);
  const logout = useStore(s => s.logout);
  const [, force] = useState(0);

  const [tab, setTab] = useState<'services' | 'tiers' | 'system'>('services');
  const [svcModal, setSvcModal] = useState(false);
  const [editSvc, setEditSvc] = useState<ServiceItem | null>(null);
  const [svcForm, setSvcForm] = useState<Omit<ServiceItem, 'id'>>({
    name: '', category: '美发', price: 0, duration: 60,
    commissionType: 'percent', commissionValue: 10, desc: '', isActive: true,
  });
  const [confirmReset, setConfirmReset] = useState(false);
  const [tierDraft, setTierDraft] = useState(depositTiers.map(t => ({ ...t })));

  const openSvc = (s?: ServiceItem) => {
    if (s) {
      setEditSvc(s);
      setSvcForm({ name: s.name, category: s.category, price: s.price, duration: s.duration, commissionType: s.commissionType, commissionValue: s.commissionValue, desc: s.desc, isActive: s.isActive });
    } else {
      setEditSvc(null);
      setSvcForm({ name: '', category: '美发', price: 0, duration: 60, commissionType: 'percent', commissionValue: 10, desc: '', isActive: true });
    }
    setSvcModal(true);
  };

  const submitSvc = () => {
    if (!svcForm.name.trim()) { toast.show('请输入服务名称', 'warning'); return; }
    if (svcForm.price <= 0) { toast.show('请输入服务价格', 'warning'); return; }
    if (editSvc) {
      updateService(editSvc.id, svcForm);
      toast.show('服务已更新');
    } else {
      addService(svcForm);
      toast.show('服务已添加');
    }
    setSvcModal(false);
  };

  const saveTiers = () => {
    if (tierDraft.some(t => t.amount <= 0)) { toast.show('储值金额必须大于0', 'warning'); return; }
    setDepositTiers(tierDraft);
    toast.show('储值档位已保存');
  };

  const doReset = () => {
    resetData();
    setConfirmReset(false);
    toast.show('数据已重置');
    setTimeout(() => logout(), 600);
  };

  const SectionHeader = ({ icon: Icon, title, desc, action }: any) => (
    <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-soft">
            <Icon size={20} />
          </div>
          <h3 className="font-display text-xl font-bold text-salon-ink">{title}</h3>
        </div>
        <p className="text-xs text-salon-sub ml-12">{desc}</p>
      </div>
      {action}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in-up max-w-6xl mx-auto">
      <div>
        <h2 className="font-display text-2xl font-bold text-salon-ink">系统设置</h2>
        <p className="text-sm text-salon-sub mt-1">服务项目、储值档位和系统偏好</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-2xl p-1.5 bg-salon-bg/70 border border-salon-line w-fit">
        {[
          { k: 'services', l: '服务项目', icon: Scissors },
          { k: 'tiers', l: '储值档位', icon: Tag },
          { k: 'system', l: '系统偏好', icon: Palette },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-medium transition-all
              ${tab === t.k ? 'bg-white shadow-soft text-brand-600' : 'text-salon-sub hover:text-salon-ink'}`}
          >
            <t.icon size={15} />{t.l}
          </button>
        ))}
      </div>

      {tab === 'services' && (
        <div className="card p-6">
          <SectionHeader
            icon={Scissors} title="服务项目" desc="管理门店的全部服务品类、价格和提成规则"
            action={<button onClick={() => openSvc()} className="btn-primary !py-2 text-sm">
              <Plus size={16} />新增服务
            </button>}
          />
          {services.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(s => {
                const cat = categoryOptions.find(c => c.k === s.category) || categoryOptions[5];
                return (
                  <div key={s.id} className={`p-4 rounded-2xl border-2 transition-all bg-white relative overflow-hidden
                    ${s.isActive ? 'border-salon-line hover:border-brand-200 hover:shadow-soft' : 'border-dashed border-salon-line opacity-50'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-50 to-rose-50 border border-brand-100 flex items-center justify-center text-2xl">
                          {cat.emoji}
                        </div>
                        <div>
                          <div className="font-semibold text-salon-ink">{s.name}</div>
                          <div className="text-[11px] text-salon-sub">{s.category} · {s.duration}分钟</div>
                        </div>
                      </div>
                      <div className="font-display text-2xl font-bold text-brand-600 tabular-nums">{formatCurrency(s.price)}</div>
                    </div>
                    <div className="pt-3 border-t border-dashed border-salon-line text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-salon-sub">提成方式</span>
                        <span className="font-medium text-salon-ink">
                          {s.commissionType === 'percent' ? `${s.commissionValue}% 比例` : `¥${s.commissionValue} 固定`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-salon-sub">预计提成</span>
                        <span className="font-medium text-brand-600 tabular-nums">
                          {formatCurrency(s.commissionType === 'percent' ? s.price * s.commissionValue / 100 : s.commissionValue)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => openSvc(s)} className="flex-1 btn-ghost !py-1.5 text-xs">
                        <Edit3 size={13} />编辑
                      </button>
                      <button onClick={() => { deleteService(s.id); toast.show('服务已删除'); }} className="btn-danger !py-1.5 !px-2 text-xs">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'tiers' && (
        <div className="card p-6">
          <SectionHeader
            icon={Tag} title="储值档位设置" desc="充值档位和赠送金额，自动保存生效"
            action={<button onClick={saveTiers} className="btn-primary !py-2 text-sm">
              <Check size={16} />保存设置
            </button>}
          />
          <div className="space-y-3 max-w-3xl">
            {tierDraft.map((t, i) => (
              <div key={i} className="p-4 rounded-2xl border-2 border-salon-line bg-white hover:border-brand-200 transition-all flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center font-display font-bold text-lg shadow-soft shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-salon-sub mb-1">充值本金 (¥)</label>
                    <input
                      type="number"
                      className="input !py-2 !px-3 text-sm tabular-nums"
                      value={t.amount}
                      onChange={e => { const nd = [...tierDraft]; nd[i].amount = Number(e.target.value); setTierDraft(nd); }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-salon-sub mb-1">赠送金额 (¥)</label>
                    <input
                      type="number"
                      className="input !py-2 !px-3 text-sm tabular-nums"
                      value={t.bonusAmount}
                      onChange={e => { const nd = [...tierDraft]; nd[i].bonusAmount = Number(e.target.value); setTierDraft(nd); }}
                    />
                  </div>
                </div>
                {t.bonusAmount > 0 && (
                  <div className="text-right shrink-0">
                    <div className="text-[10px] text-salon-sub mb-1">到账</div>
                    <div className="font-display font-bold text-brand-600 tabular-nums">{formatCurrency(t.amount + t.bonusAmount)}</div>
                  </div>
                )}
                {tierDraft.length > 1 && (
                  <button
                    onClick={() => setTierDraft(tierDraft.filter((_, idx) => idx !== i))}
                    className="btn-danger !py-1.5 !px-2 text-xs shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setTierDraft([...tierDraft, { amount: 500, bonusAmount: 50 }])}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-brand-300 text-brand-600 hover:bg-brand-50/50 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} />添加新档位
            </button>
          </div>
        </div>
      )}

      {tab === 'system' && (
        <div className="space-y-5">
          <div className="card p-6">
            <SectionHeader icon={Bell} title="自动提醒偏好" desc="流失预警与生日关怀的系统规则" />
            <div className="space-y-4 max-w-2xl">
              {[
                { title: '流失预警', desc: '超过 60 天未到店的会员自动标记为流失预警', on: true },
                { title: '生日自动提醒', desc: '会员生日当天在营销中心显示并可一键发送祝福', on: true },
                { title: '生日券自动发放', desc: '生日当天自动存入 ¥66 专属优惠券', on: true },
                { title: '套餐到期提醒', desc: '套餐剩余有效期 ≤ 7 天时在会员详情提示', on: true },
              ].map(r => (
                <div key={r.title} className="flex items-center justify-between p-4 rounded-2xl bg-salon-bg/40 border border-salon-line">
                  <div>
                    <div className="font-medium text-sm text-salon-ink">{r.title}</div>
                    <div className="text-[11px] text-salon-sub mt-0.5">{r.desc}</div>
                  </div>
                  <div className={`w-12 h-7 rounded-full p-0.5 transition-all ${r.on ? 'bg-brand-gradient' : 'bg-salon-line'}`}>
                    <div className={`w-6 h-6 rounded-full bg-white shadow-md transition-transform ${r.on ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <SectionHeader icon={Database} title="数据管理" desc="本地数据备份与重置" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border-2 border-salon-line bg-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-salon-green flex items-center justify-center">
                    <Database size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">导出数据备份</div>
                    <div className="text-[11px] text-salon-sub">将全部数据下载为 JSON 文件</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const data = localStorage.getItem('salon-ms-storage');
                    if (!data) return toast.show('暂无数据', 'warning');
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `雅致沙龙数据备份-${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    toast.show('数据已导出');
                  }}
                  className="w-full mt-3 btn-ghost !py-2 text-sm"
                >下载备份文件</button>
              </div>
              <div className="p-5 rounded-2xl border-2 border-rose-200 bg-rose-50/40">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center">
                    <RefreshCw size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-rose-600">重置演示数据</div>
                    <div className="text-[11px] text-salon-sub">清空全部数据并重新生成 Mock 数据</div>
                  </div>
                </div>
                <button onClick={() => setConfirmReset(true)} className="w-full mt-3 btn-danger !py-2 text-sm">
                  重置为初始状态
                </button>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <SectionHeader icon={Palette} title="关于系统" desc="雅致沙龙会员管理系统" />
            <div className="max-w-md space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-dashed border-salon-line"><span className="text-salon-sub">系统名称</span><span className="font-medium">雅致沙龙 · 会员管理系统</span></div>
              <div className="flex justify-between py-2 border-b border-dashed border-salon-line"><span className="text-salon-sub">当前版本</span><span className="font-medium tabular-nums">v1.0.0</span></div>
              <div className="flex justify-between py-2 border-b border-dashed border-salon-line"><span className="text-salon-sub">适用门店</span><span className="font-medium">美发 · 美容 · 美甲 · SPA 单店</span></div>
              <div className="flex justify-between py-2"><span className="text-salon-sub">技术支持</span><span className="font-medium">Salon MS Team</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      <Modal open={svcModal} onClose={() => setSvcModal(false)} title={editSvc ? '编辑服务项目' : '新增服务项目'} size="md">
        <div className="p-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-salon-ink mb-1.5">服务名称 <span className="text-rose-500">*</span></label>
              <input className="input !py-2.5" value={svcForm.name} onChange={e => setSvcForm({ ...svcForm, name: e.target.value })} placeholder="例如：女士精剪" />
            </div>
            <div>
              <label className="block text-xs font-medium text-salon-ink mb-1.5">服务分类</label>
              <select
                className="input !py-2.5 !pr-10"
                value={svcForm.category}
                onChange={e => setSvcForm({ ...svcForm, category: e.target.value as any })}
              >
                {categoryOptions.map(c => <option key={c.k} value={c.k}>{c.emoji} {c.k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-salon-ink mb-1.5">价格 (¥) <span className="text-rose-500">*</span></label>
              <input type="number" className="input !py-2.5 tabular-nums" value={svcForm.price} onChange={e => setSvcForm({ ...svcForm, price: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-salon-ink mb-1.5">时长 (分钟)</label>
              <input type="number" className="input !py-2.5 tabular-nums" value={svcForm.duration} onChange={e => setSvcForm({ ...svcForm, duration: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-salon-ink mb-1.5">提成方式</label>
              <select
                className="input !py-2.5 !pr-10"
                value={svcForm.commissionType}
                onChange={e => setSvcForm({ ...svcForm, commissionType: e.target.value as any })}
              >
                <option value="percent">按比例 %</option>
                <option value="fixed">固定金额 ¥</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-salon-ink mb-1.5">
                提成{svcForm.commissionType === 'percent' ? '比例 (%)' : '金额 (¥)'}
              </label>
              <input type="number" className="input !py-2.5 tabular-nums" value={svcForm.commissionValue} onChange={e => setSvcForm({ ...svcForm, commissionValue: Number(e.target.value) })} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-salon-ink mb-1.5">服务说明（选填）</label>
              <textarea
                className="input !py-2.5 min-h-[80px] resize-none"
                value={svcForm.desc}
                onChange={e => setSvcForm({ ...svcForm, desc: e.target.value })}
                placeholder="服务内容、适合人群等"
              />
            </div>
          </div>
        </div>
        <div className="p-5 pt-2 flex gap-3">
          <button onClick={() => setSvcModal(false)} className="flex-1 btn-ghost">取消</button>
          <button onClick={submitSvc} className="flex-1 btn-primary">
            <Check size={16} />{editSvc ? '保存修改' : '确认添加'}
          </button>
        </div>
      </Modal>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} size="sm">
        <div className="p-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4 animate-pulse-soft">
            <RefreshCw size={26} />
          </div>
          <h3 className="font-display text-xl font-bold text-center mb-2">确认重置数据？</h3>
          <p className="text-sm text-salon-sub text-center leading-relaxed">
            此操作将清空全部会员、消费记录、员工等数据，并重新生成示例数据。<br />
            <span className="text-rose-500 font-medium">此操作不可撤销！</span>
          </p>
        </div>
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button onClick={() => setConfirmReset(false)} className="flex-1 btn-ghost">取消</button>
          <button onClick={doReset} className="flex-1 btn-danger">确认重置</button>
        </div>
      </Modal>

      <div className="h-8" />
    </div>
  );
};
