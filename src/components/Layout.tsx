import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, Wallet, Megaphone, UsersRound,
  Settings, LogOut, Scissors, Sparkles, BarChart3,
} from 'lucide-react';
import { useStore } from '@/store';
import { Avatar } from './Avatar';

const NAV = [
  { to: '/dashboard', label: '数据仪表盘', icon: LayoutDashboard },
  { to: '/members', label: '会员管理', icon: Users },
  { to: '/cashier', label: '消费收银', icon: CreditCard },
  { to: '/recharge', label: '充值中心', icon: Wallet },
  { to: '/marketing', label: '营销中心', icon: Megaphone },
  { to: '/employees', label: '员工管理', icon: UsersRound, admin: true },
  { to: '/commission', label: '提成报表', icon: BarChart3, admin: true },
  { to: '/settings', label: '系统设置', icon: Settings, admin: true },
];

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const loc = useLocation();
  const emp = useStore(s => s.getCurrentEmployee());
  const logout = useStore(s => s.logout);
  const isAdmin = emp?.role === 'admin';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="h-full flex bg-salon-bg">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 h-full border-r border-salon-line bg-white/70 backdrop-blur-xl flex flex-col">
        <div className="px-5 py-6 border-b border-salon-line">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-gradient shadow-glow flex items-center justify-center animate-pulse-soft">
              <Scissors size={22} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-salon-ink leading-tight">雅致沙龙</h1>
              <p className="text-[11px] text-salon-sub">会员管理系统</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {NAV.filter(n => !n.admin || isAdmin).map(item => {
            const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + '/');
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`nav-item group ${active ? 'active' : ''}`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {active && <Sparkles size={14} className="ml-auto text-white/80" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-salon-line">
          {emp && (
            <div className="card p-3">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={emp.name} size="md" type="employee" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-salon-ink truncate">{emp.name}</div>
                  <div className="text-[11px] text-salon-sub truncate">
                    {emp.role === 'admin' ? '管理员' : '店员'} · {emp.position}
                  </div>
                </div>
              </div>
              <button onClick={handleLogout} className="w-full btn-soft text-xs py-2">
                <LogOut size={14} />
                退出登录
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
