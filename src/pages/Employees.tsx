import React, { useMemo, useState } from 'react';
import {
  Users, UserPlus, Edit3, Trash2, Check, X, Scissors,
  Shield, ShieldCheck, Crown, Search, Phone, Calendar, Lock,
} from 'lucide-react';
import dayjs from 'dayjs';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { Modal } from '@/components/Modal';
import { Empty } from '@/components/Empty';
import { formatCurrency, formatDate } from '@/utils';
import type { Employee } from '@/types';

const roleLabel: Record<string, { label: string; icon: any; color: string }> = {
  admin: { label: '管理员', icon: Crown, color: 'text-brand-600 bg-brand-100' },
  senior: { label: '资深造型师', icon: ShieldCheck, color: 'text-rose-500 bg-rose-100' },
  stylist: { label: '造型师', icon: Scissors, color: 'text-amber-600 bg-amber-100' },
  staff: { label: '前台/助理', icon: Shield, color: 'text-salon-green bg-emerald-100' },
};

export const Employees: React.FC = () => {
  const toast = useToast();
  const employees = useStore(s => s.employees);
  const transactions = useStore(s => s.transactions);
  const currentUser = useStore(s => s.currentUser);
  const addEmployee = useStore(s => s.addEmployee);
  const updateEmployee = useStore(s => s.updateEmployee);
  const deleteEmployee = useStore(s => s.deleteEmployee);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDel, setConfirmDel] = useState<Employee | null>(null);

  const [form, setForm] = useState({
    name: '', phone: '', password: '123456',
    role: 'stylist' as Employee['role'], baseSalary: 5000,
    commissionRate: 10,
  });

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return employees.filter(e => !kw || e.name.toLowerCase().includes(kw) || e.phone.includes(kw));
  }, [employees, search]);

  const monthCommission = (empId: string) => {
    const start = dayjs().startOf('month');
    return transactions
      .filter(t => dayjs(t.createdAt).isAfter(start) && t.items.some(i => i.employeeId === empId))
      .reduce((sum, t) => sum + t.items.filter(i => i.employeeId === empId).reduce((s, i) => s + i.commissionAmount, 0), 0);
  };

  const openModal = (emp?: Employee) => {
    if (emp) {
      setEditing(emp);
      setForm({ name: emp.name, phone: emp.phone, password: emp.password, role: emp.role, baseSalary: emp.baseSalary, commissionRate: emp.commissionRate });
    } else {
      setEditing(null);
      setForm({ name: '', phone: '', password: '123456', role: 'stylist', baseSalary: 5000, commissionRate: 10 });
    }
    setModal(true);
  };

  const submit = () => {
    if (!form.name.trim()) { toast.show('请输入员工姓名', 'warning'); return; }
    if (!/^1\d{10}$/.test(form.phone)) { toast.show('请输入正确的11位手机号', 'warning'); return; }
    if (!form.password.trim()) { toast.show('请设置登录密码', 'warning'); return; }
    const payload = {
      name: form.name,
      phone: form.phone,
      password: form.password,
      role: form.role,
      baseSalary: form.baseSalary,
      commissionRate: form.commissionRate,
      position: (roleLabel[form.role] || roleLabel.staff).label,
      hireDate: editing ? '' : dayjs().toISOString(),
      isActive: true,
    };
    if (editing) {
      updateEmployee(editing.id, payload as any);
      toast.show('员工信息已更新');
    } else {
      addEmployee(payload);
      toast.show('员工已添加');
    }
    setModal(false);
  };

  const removeEmployee = (e: Employee) => {
    if (currentUser?.id === e.id) { toast.show('不能删除当前登录账号', 'warning'); return; }
    deleteEmployee(e.id);
    setConfirmDel(null);
    toast.show(`已删除 ${e.name}`);
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">员工管理</h2>
          <p className="text-sm text-salon-sub mt-1">员工账号 · 权限 · 提成参数</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary">
          <UserPlus size={18} />新增员工
        </button>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="section-title">
            <Users size={18} className="text-brand-500" />员工列表
            <span className="ml-2 text-xs text-salon-sub font-normal">共 {employees.length} 人</span>
          </div>
          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
            <input
              className="input pl-10 py-2 text-sm"
              placeholder="搜索姓名/手机号..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <Empty query={search} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(emp => {
              const mc = monthCommission(emp.id);
              const r = roleLabel[emp.role] || roleLabel.staff;
              return (
                <div key={emp.id} className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden
                  ${currentUser?.id === emp.id ? 'border-brand-300 bg-brand-50/30' : 'border-salon-line bg-white hover:border-brand-200 hover:shadow-soft'}`}>
                  {currentUser?.id === emp.id && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-gradient text-white text-[10px] font-semibold">
                      当前登录
                    </span>
                  )}
                  <div className="flex items-start gap-4">
                    <Avatar name={emp.name} size="lg" isEmployee />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-lg">{emp.name}</span>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${r.color}`}>
                          <r.icon size={10} />{r.label}
                        </span>
                      </div>
                      <div className="text-xs text-salon-sub flex items-center gap-3">
                        <span className="flex items-center gap-1"><Phone size={10} />{emp.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-dashed border-salon-line grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] text-salon-sub mb-1">本月提成</div>
                      <div className="text-sm font-bold text-brand-600 tabular-nums">{formatCurrency(mc)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-salon-sub mb-1">底薪</div>
                      <div className="text-sm font-semibold text-salon-ink tabular-nums">{formatCurrency(emp.baseSalary)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-salon-sub mb-1">提成比例</div>
                      <div className="text-sm font-semibold text-salon-ink tabular-nums">{emp.commissionRate}%</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openModal(emp)} className="flex-1 btn-ghost !py-2 text-xs">
                      <Edit3 size={14} />编辑
                    </button>
                    <button
                      onClick={() => setConfirmDel(emp)}
                      disabled={emp.id === currentUser?.id || emp.role === 'admin'}
                      className="btn-danger !py-2 !px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? '编辑员工' : '新增员工'} size="md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
          <div>
            <label className="block text-xs font-medium text-salon-ink mb-1.5">姓名 <span className="text-rose-500">*</span></label>
            <input className="input !py-2.5" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="例如：李小美" />
          </div>
          <div>
            <label className="block text-xs font-medium text-salon-ink mb-1.5">手机号 <span className="text-rose-500">*</span></label>
            <input className="input !py-2.5" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })} placeholder="11位登录手机号" />
          </div>
          <div>
            <label className="block text-xs font-medium text-salon-ink mb-1.5">登录密码 <span className="text-rose-500">*</span></label>
            <div className="relative">
              <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
              <input className="input pl-10 !py-2.5" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-salon-ink mb-1.5">职位角色</label>
            <select
              className="input !py-2.5 !pr-10"
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value as any })}
            >
              <option value="admin">管理员（全部权限）</option>
              <option value="senior">资深造型师</option>
              <option value="stylist">造型师</option>
              <option value="staff">前台/助理</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-salon-ink mb-1.5">底薪（元）</label>
            <input type="number" className="input !py-2.5 tabular-nums" value={form.baseSalary} onChange={e => setForm({ ...form, baseSalary: Number(e.target.value) })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-salon-ink mb-1.5">默认提成比例（%）</label>
            <input type="number" className="input !py-2.5 tabular-nums" value={form.commissionRate} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} />
          </div>
        </div>
        <div className="p-5 pt-2 flex gap-3">
          <button onClick={() => setModal(false)} className="flex-1 btn-ghost">取消</button>
          <button onClick={submit} className="flex-1 btn-primary">
            <Check size={16} />{editing ? '保存修改' : '确认新增'}
          </button>
        </div>
      </Modal>

      <Modal open={!!confirmDel} onClose={() => setConfirmDel(null)} size="sm">
        <div className="p-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mb-4">
            <Trash2 size={26} />
          </div>
          <h3 className="font-display text-xl font-bold text-center mb-2">确认删除员工</h3>
          <p className="text-sm text-salon-sub text-center leading-relaxed">
            确定要删除 <span className="font-semibold text-salon-ink">{confirmDel?.name}</span> 吗？
            <br />历史消费数据会保留，但该账号将无法登录。
          </p>
        </div>
        <div className="px-6 pb-6 pt-2 flex gap-3">
          <button onClick={() => setConfirmDel(null)} className="flex-1 btn-ghost">取消</button>
          <button onClick={() => confirmDel && removeEmployee(confirmDel)} className="flex-1 btn-danger">
            确认删除
          </button>
        </div>
      </Modal>

      <div className="h-8" />
    </div>
  );
};
