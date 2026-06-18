import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, X, Plus } from 'lucide-react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import type { MemberLevel } from '@/types';

const ALLERGIES = ['染发剂过敏', '香精过敏', '酒精过敏', '花粉过敏', '金属过敏', '乳胶过敏'];

export const MemberForm: React.FC = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const isEdit = !!id;
  const employees = useStore(s => s.employees).filter(e => e.isActive);
  const member = useStore(s => s.members.find(m => m.id === id));
  const addMember = useStore(s => s.addMember);
  const updateMember = useStore(s => s.updateMember);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    gender: '女' as '男' | '女',
    birthday: '',
    preferredStylistId: '' as string | undefined,
    allergies: [] as string[],
    remark: '',
    customAllergy: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && member) {
      setForm({
        name: member.name, phone: member.phone, gender: member.gender, birthday: member.birthday,
        preferredStylistId: member.preferredStylistId, allergies: [...member.allergies],
        remark: member.remark, customAllergy: '',
      });
    }
  }, [isEdit, member]);

  const toggleAllergy = (a: string) => setForm(f => ({
    ...f,
    allergies: f.allergies.includes(a) ? f.allergies.filter(x => x !== a) : [...f.allergies, a],
  }));

  const addCustomAllergy = () => {
    if (!form.customAllergy.trim()) return;
    const v = form.customAllergy.trim();
    if (!form.allergies.includes(v)) setForm(f => ({ ...f, allergies: [...f.allergies, v], customAllergy: '' }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('请填写会员姓名'); return; }
    if (!/^1\d{10}$/.test(form.phone)) { setError('请填写正确的11位手机号'); return; }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      gender: form.gender,
      birthday: form.birthday,
      preferredStylistId: form.preferredStylistId || undefined,
      allergies: form.allergies,
      remark: form.remark,
    };

    if (isEdit && member) {
      updateMember(member.id, payload);
      toast.show('会员档案已更新');
    } else {
      const created = addMember(payload);
      toast.show('会员档案创建成功');
      nav(`/members/${created.id}`, { replace: true });
      return;
    }
    nav(-1);
  };

  const level: MemberLevel = isEdit && member ? member.level : '普通';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <button onClick={() => nav(-1)} className="btn-ghost !p-2.5">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">
            {isEdit ? '编辑会员档案' : '新增会员档案'}
          </h2>
          <p className="text-sm text-salon-sub mt-1">
            {isEdit ? `编辑 #${id} 的会员信息` : '顾客首次到店，创建会员档案'}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Basic info */}
        <div className="card p-6 space-y-5">
          <div className="section-title">
            <AlertCircle size={16} className="text-brand-500" />基本信息
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="form-label">
                姓名 <span className="text-rose-500">*</span>
              </label>
              <input
                className="input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="请输入顾客姓名"
              />
            </div>
            <div>
              <label className="form-label">
                手机号 <span className="text-rose-500">*</span>
              </label>
              <input
                className="input"
                value={form.phone}
                maxLength={11}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="11位手机号码"
              />
            </div>
            <div>
              <label className="form-label">性别</label>
              <div className="grid grid-cols-2 gap-2">
                {(['女', '男'] as const).map(g => (
                  <button type="button" key={g} onClick={() => setForm(f => ({ ...f, gender: g }))}
                    className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                      ${form.gender === g
                        ? 'bg-brand-gradient text-white border-transparent shadow-soft'
                        : 'bg-white border-salon-line text-salon-ink hover:border-brand-300'}`}>
                    {g}士
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="form-label">生日</label>
              <input
                type="date"
                className="input"
                value={form.birthday}
                onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">惯用发型师</label>
              <select
                className="input"
                value={form.preferredStylistId || ''}
                onChange={e => setForm(f => ({ ...f, preferredStylistId: e.target.value || undefined }))}
              >
                <option value="">— 暂未指定 —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} · {e.position}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="card p-6 space-y-4">
          <div className="section-title">过敏成分（请勾选以提醒服务人员）</div>
          <div className="flex flex-wrap gap-2">
            {ALLERGIES.map(a => {
              const active = form.allergies.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergy(a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${active
                      ? 'bg-rose-50 text-rose-600 border-rose-300'
                      : 'bg-white text-salon-sub border-salon-line hover:border-rose-200 hover:text-rose-500'}`}
                >
                  {active && <X size={11} className="inline mr-1 -mt-0.5" />}
                  {a}
                </button>
              );
            })}
          </div>

          {form.allergies.filter(a => !ALLERGIES.includes(a)).length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {form.allergies.filter(a => !ALLERGIES.includes(a)).map(a => (
                <span key={a} className="px-3 py-1.5 rounded-full text-xs font-medium bg-rose-50 text-rose-600 border border-rose-300">
                  <X size={11} className="inline mr-1 -mt-0.5 cursor-pointer" onClick={() => toggleAllergy(a)} />
                  {a}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="input"
              placeholder="输入自定义过敏成分..."
              value={form.customAllergy}
              onChange={e => setForm(f => ({ ...f, customAllergy: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomAllergy(); } }}
            />
            <button type="button" onClick={addCustomAllergy} className="btn-ghost shrink-0">
              <Plus size={16} />添加
            </button>
          </div>
        </div>

        {/* Remark */}
        <div className="card p-6 space-y-4">
          <div className="section-title">服务备注</div>
          <textarea
            className="input min-h-[90px] resize-y"
            value={form.remark}
            onChange={e => setForm(f => ({ ...f, remark: e.target.value }))}
            placeholder="如：头皮敏感、喜欢安静、服务节奏需放慢等..."
          />
        </div>

        {isEdit && member && (
          <div className="card p-5 gradient-border">
            <div className="text-xs text-salon-sub mb-3">当前会员等级</div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-display font-bold text-brand-600">{level}会员</div>
                <div className="text-xs text-salon-sub mt-1">
                  累计消费 {isEdit ? `¥${member.totalSpent.toFixed(2)}` : '¥0.00'} · 到店 {isEdit ? member.totalVisits : 0} 次
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-salon-sub">距离{level === '钻石' ? '顶' : '升级'}还需</div>
                <div className="text-sm font-bold text-brand-600 tabular-nums mt-1">
                  {level === '钻石' ? '已是顶级' :
                    `¥${(
                      (level === '普通' ? 500 : level === '银卡' ? 2000 : 5000) -
                      (member?.totalSpent || 0)
                    ).toFixed(2)}`}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-sm border border-rose-200 flex items-center gap-2">
            <AlertCircle size={16} />{error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pb-8 sticky bottom-0 bg-salon-bg/90 backdrop-blur py-4 -mx-6 md:-mx-8 px-6 md:px-8 mt-4">
          <button type="button" onClick={() => nav(-1)} className="btn-ghost">取消</button>
          <button type="submit" className="btn-primary min-w-[140px]">
            <Save size={16} />
            {isEdit ? '保存修改' : '创建档案'}
          </button>
        </div>
      </form>
    </div>
  );
};
