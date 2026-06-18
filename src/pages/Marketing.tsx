import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  AlertTriangle, Gift, Cake, Megaphone, MessageSquare, Users, ArrowRight,
  UserX, Check,
} from 'lucide-react';
import { useStore } from '@/store';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { LevelBadge } from '@/components/LevelBadge';
import { Modal } from '@/components/Modal';
import {
  formatCurrency, formatDate, isBirthdayToday, isBirthdayThisWeek, daysBetween,
} from '@/utils';

export const Marketing: React.FC = () => {
  const toast = useToast();
  const members = useStore(s => s.members);
  const addCoupon = useStore(s => s.addCoupon);

  const atRisk = useMemo(() =>
    members.filter(m => m.isAtRisk).sort((a, b) =>
      dayjs(b.lastVisitDate).diff(dayjs(a.lastVisitDate))
    ), [members]);

  const todayBday = useMemo(() =>
    members.filter(m => m.birthday && isBirthdayToday(m.birthday)), [members]);

  const weekBday = useMemo(() =>
    members.filter(m => m.birthday && !isBirthdayToday(m.birthday) && isBirthdayThisWeek(m.birthday)),
  [members]);

  const [smsModalMember, setSmsModalMember] = useState<any>(null);
  const [smsType, setSmsType] = useState<'recall' | 'birthday' | 'care'>('recall');

  const sendRecall = (m: any) => {
    setSmsModalMember(m); setSmsType('recall');
    addCoupon({
      memberId: m.id, name: '专属唤回优惠券',
      discountType: 'percent', discountValue: 20, minAmount: 100,
      expireDate: dayjs().add(15, 'day').toISOString(), isUsed: false,
    });
    toast.show(`已向 ${m.name} 发送唤回短信+8折优惠券`);
    setTimeout(() => setSmsModalMember(null), 1500);
  };

  const sendBirthday = (m: any) => {
    setSmsModalMember(m); setSmsType('birthday');
    addCoupon({
      memberId: m.id, name: '生日专属优惠券',
      discountType: 'fixed', discountValue: 66, minAmount: 200,
      expireDate: dayjs().add(30, 'day').toISOString(), isUsed: false,
    });
    toast.show(`已向 ${m.name} 发送生日祝福+¥66生日券`);
    setTimeout(() => setSmsModalMember(null), 1500);
  };

  const sendAllRisk = () => {
    atRisk.forEach(m => {
      addCoupon({
        memberId: m.id, name: '老会员唤回券',
        discountType: 'percent', discountValue: 15, minAmount: 80,
        expireDate: dayjs().add(15, 'day').toISOString(), isUsed: false,
      });
    });
    toast.show(`已向全部 ${atRisk.length} 位会员发送唤回短信及优惠券`);
  };

  const Card = ({ title, icon: Icon, count, color, children, action }: any) => (
    <div className="card p-6 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <span className="section-title">{title}</span>
          </div>
          <div className="text-xs text-salon-sub ml-11">共 {count} 位</div>
        </div>
        {action}
      </div>
      {children}
    </div>
  );

  const MemberItem = ({ m, type, onSend, primaryLabel }: any) => {
    const away = daysBetween(m.lastVisitDate);
    return (
      <div className="p-4 rounded-2xl border border-salon-line hover:bg-brand-50/40 hover:border-brand-200 transition-all flex items-center gap-4">
        <Avatar name={m.name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-medium truncate">{m.name}</span>
            <LevelBadge level={m.level} className="!py-0 !px-1.5 !text-[10px]" />
            {type === 'bday' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gradient-to-r from-rose-400 to-pink-400 text-white text-[10px] font-semibold">
                <Cake size={10} />生日快乐
              </span>
            )}
          </div>
          <div className="text-[11px] text-salon-sub flex items-center gap-2 flex-wrap">
            <span>{m.phone}</span>
            <span>·</span>
            {type === 'risk'
              ? <span className={away > 120 ? 'text-rose-500 font-medium' : 'text-amber-600 font-medium'}>
                <UserX size={11} className="inline -mt-0.5 mr-0.5" />{away}天未到店
              </span>
              : <span className="text-rose-500 font-medium">🎂 生日 {formatDate(m.birthday)}</span>
            }
            <span>·</span>
            <span>累计消费 {formatCurrency(m.totalSpent)}</span>
          </div>
        </div>
        <button onClick={() => onSend(m)} className="btn-primary !py-2 !px-4 text-xs shrink-0">
          <MessageSquare size={14} />{primaryLabel}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-salon-ink">营销中心</h2>
          <p className="text-sm text-salon-sub mt-1">流失会员唤回 · 生日祝福 · 会员关怀</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-rose-100/60 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 text-white flex items-center justify-center shadow-soft">
              <AlertTriangle size={26} />
            </div>
            <div>
              <div className="text-xs text-salon-sub mb-1">流失预警会员</div>
              <div className="font-display text-3xl font-bold text-rose-500 tabular-nums">{atRisk.length}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-amber-100/60 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center shadow-soft">
              <Cake size={26} />
            </div>
            <div>
              <div className="text-xs text-salon-sub mb-1">今日生日</div>
              <div className="font-display text-3xl font-bold text-amber-600 tabular-nums">{todayBday.length}</div>
            </div>
          </div>
        </div>
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-salon-green/10 blur-2xl" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-salon-green text-white flex items-center justify-center shadow-soft">
              <Gift size={26} />
            </div>
            <div>
              <div className="text-xs text-salon-sub mb-1">本周生日</div>
              <div className="font-display text-3xl font-bold text-salon-green tabular-nums">{weekBday.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS template hints */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { t: '【雅致沙龙】尊敬的XX，您已60天未光顾，送您8折专属券，30天内到店可用，退订回T', color: 'from-rose-100 to-rose-50 border-rose-200', icon: AlertTriangle },
          { t: '【雅致沙龙】XX您好！今天是您的生日，雅致沙龙全体员工祝您生日快乐！生日礼券¥66已存入账户，欢迎享用～', color: 'from-amber-100 to-amber-50 border-amber-200', icon: Cake },
          { t: '【雅致沙龙】亲爱的XX，感谢您一直以来的支持，我们新推出头皮护理项目，诚邀您体验，老会员享专属特惠', color: 'from-brand-100 to-brand-50 border-brand-200', icon: Megaphone },
        ].map((t, i) => (
          <div key={i} className={`p-4 rounded-2xl bg-gradient-to-br ${t.color} border`}>
            <t.icon size={16} className="text-salon-sub mb-2" />
            <div className="text-[12px] text-salon-ink leading-relaxed">{t.t}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        <Card
          title="流失预警 · 一键唤回"
          icon={AlertTriangle}
          count={atRisk.length}
          color="bg-rose-100 text-rose-500"
          action={atRisk.length > 0 && (
            <button onClick={sendAllRisk} className="btn-danger !py-2 !px-4 text-xs">
              <MessageSquare size={14} />一键全部唤回
            </button>
          )}
        >
          <div className="space-y-3 max-h-[440px] overflow-y-auto scrollbar-thin pr-1">
            {atRisk.length === 0
              ? <div className="py-10 text-center text-sm text-salon-sub flex flex-col items-center">
                <Users size={30} className="text-brand-200 mb-3" />
                🎉 暂无流失会员，会员维系做得不错！
              </div>
              : atRisk.map(m => (
                <MemberItem key={m.id} m={m} type="risk" onSend={sendRecall} primaryLabel="一键唤回" />
              ))}
          </div>
        </Card>

        <Card
          title="今日生日 · 祝福推送"
          icon={Cake}
          count={todayBday.length}
          color="bg-amber-100 text-amber-600"
        >
          <div className="space-y-3">
            {todayBday.length === 0
              ? <div className="py-10 text-center text-sm text-salon-sub flex flex-col items-center">
                <Cake size={30} className="text-brand-200 mb-3" />
                今日暂无过生日的会员
              </div>
              : todayBday.map(m => (
                <MemberItem key={m.id} m={m} type="bday" onSend={sendBirthday} primaryLabel="发送祝福" />
              ))}
          </div>
        </Card>

        <Card
          title="本周生日 · 提前关怀"
          icon={Gift}
          count={weekBday.length}
          color="bg-emerald-100 text-salon-green"
        >
          <div className="space-y-3 max-h-[360px] overflow-y-auto scrollbar-thin pr-1">
            {weekBday.length === 0
              ? <div className="py-10 text-center text-sm text-salon-sub flex flex-col items-center">
                <Gift size={30} className="text-brand-200 mb-3" />
                本周暂无过生日的会员
              </div>
              : weekBday.map(m => (
                <MemberItem key={m.id} m={m} type="bday" onSend={sendBirthday} primaryLabel="提前祝福" />
              ))}
          </div>
        </Card>
      </div>

      <Modal open={!!smsModalMember} onClose={() => setSmsModalMember(null)} size="sm">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-salon-green text-white flex items-center justify-center mb-5 animate-pulse-soft">
            <Check size={36} strokeWidth={3} />
          </div>
          <h3 className="font-display text-2xl font-bold text-salon-ink mb-2">短信发送成功</h3>
          {smsModalMember && (
            <div className="text-sm text-salon-sub mt-2">
              已发送至 <span className="font-medium text-salon-ink">{smsModalMember.name}</span>
              <div className="mt-3 p-3 rounded-xl bg-salon-bg/60 text-xs text-salon-sub text-left leading-relaxed">
                {smsType === 'recall' && <>【雅致沙龙】尊敬的{smsModalMember.name}，您已{daysBetween(smsModalMember.lastVisitDate)}天未光顾，特送您8折专属优惠券，15天内到店可用，期待再次为您服务！</>}
                {smsType === 'birthday' && <>【雅致沙龙】亲爱的{smsModalMember.name}，生日快乐！雅致沙龙全体员工祝您岁岁常欢愉，万事皆胜意！生日礼券¥66已存入您的账户，欢迎到店享用～</>}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <div className="h-8" />
    </div>
  );
};
