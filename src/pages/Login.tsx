import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, Scissors, Sparkles, Flower2 } from 'lucide-react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';

export const Login: React.FC = () => {
  const [phone, setPhone] = useState('13800000000');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const initData = useStore(s => s.initData);
  const login = useStore(s => s.login);
  const currentId = useStore(s => s.currentEmployeeId);
  const employees = useStore(s => s.employees);
  const nav = useNavigate();
  const toast = useToast();

  useEffect(() => { initData(); }, [initData]);
  useEffect(() => { if (currentId) nav('/dashboard'); }, [currentId, nav]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) { toast.show('请输入账号和密码', 'warning'); return; }
    setLoading(true);
    setTimeout(() => {
      const r = login(phone.trim(), password);
      setLoading(false);
      if (r) {
        toast.show(`欢迎回来，${r.name}！`);
        nav('/dashboard');
      } else {
        toast.show('账号或密码错误', 'error');
      }
    }, 400);
  };

  const quickLogin = (p: string, pw: string) => { setPhone(p); setPassword(pw); };

  return (
    <div className="h-full flex items-center justify-center p-4 md:p-8 bg-salon-bg overflow-hidden relative">
      {/* Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-rose-200/30 blur-3xl" />
        <div className="absolute top-1/4 right-1/3 text-brand-300/20 animate-pulse-soft">
          <Scissors size={140} strokeWidth={1} />
        </div>
        <div className="absolute bottom-1/4 left-1/4 text-rose-300/20 animate-pulse-soft" style={{ animationDelay: '1s' }}>
          <Flower2 size={90} strokeWidth={1} />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid md:grid-cols-2 gap-0 card overflow-hidden border-0">
        {/* Brand side */}
        <div className="hidden md:flex relative overflow-hidden p-10 flex-col justify-between bg-gradient-to-br from-brand-500 via-brand-400 to-rose-400 text-white">
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-noise" />
          <div className="absolute -right-10 -top-10 w-60 h-60 rounded-full border border-white/30" />
          <div className="absolute right-20 top-40 w-40 h-40 rounded-full border border-white/20" />
          <div className="absolute -left-8 bottom-20 w-48 h-48 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
              <Scissors size={26} />
            </div>
            <div>
              <div className="font-display text-2xl font-bold">雅致沙龙</div>
              <div className="text-xs opacity-80">Elegant Salon · Est. 2023</div>
            </div>
          </div>

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs">
              <Sparkles size={12} /> 会员管理系统 v2.0
            </div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              让每一位顾客<br />都成为回头客
            </h2>
            <p className="text-sm opacity-90 leading-relaxed max-w-sm">
              轻量化门店会员管理解决方案：智能档案、精准营销、自动提成，让您专注服务品质。
            </p>

            <div className="space-y-3 pt-4">
              {[
                { n: 35, t: '示例会员数据' },
                { n: 6, t: '个月完整消费流水' },
                { n: 15, t: '种服务项目内置' },
              ].map(s => (
                <div key={s.t} className="flex items-center gap-4">
                  <div className="text-3xl font-display font-bold tabular-nums">{s.n}+</div>
                  <div className="text-sm opacity-90">{s.t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative text-xs opacity-80">
            © 2026 雅致沙龙 All Rights Reserved
          </div>
        </div>

        {/* Form side */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 md:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white">
              <Scissors size={20} />
            </div>
            <span className="font-display text-xl font-bold">雅致沙龙</span>
          </div>

          <div className="mb-8">
            <h3 className="font-display text-2xl font-semibold text-salon-ink mb-2">欢迎登录</h3>
            <p className="text-sm text-salon-sub">请输入您的员工账号以开始使用</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="form-label">手机号 / 账号</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
                <input
                  className="input pl-11"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                />
              </div>
            </div>
            <div>
              <label className="form-label">登录密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-salon-sub" />
                <input
                  type="password"
                  className="input pl-11"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base mt-2"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-salon-line">
            <div className="text-[11px] text-salon-sub mb-3">快速体验（点击填入）</div>
            <div className="grid grid-cols-2 gap-2">
              {employees.slice(0, 4).map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => quickLogin(e.phone, e.password)}
                  className="text-left p-3 rounded-xl border border-salon-line hover:border-brand-300 hover:bg-brand-50/50 transition-all text-xs"
                >
                  <div className="font-medium text-salon-ink">
                    {e.name} <span className="text-[10px] text-brand-600">
                      {e.role === 'admin' ? '管理员' : '店员'}
                    </span>
                  </div>
                  <div className="text-salon-sub mt-0.5">{e.position}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
