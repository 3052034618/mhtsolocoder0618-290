import dayjs from 'dayjs';
import type { Member, MemberLevel, ServiceItem, TransactionItem } from '@/types';

export const formatCurrency = (n: number): string => `¥${n.toFixed(2)}`;

export const formatDate = (d: string): string => dayjs(d).format('YYYY-MM-DD');

export const formatDateTime = (d: string): string => dayjs(d).format('YYYY-MM-DD HH:mm');

export const daysBetween = (d1: string, d2: string = dayjs().toISOString()): number =>
  dayjs(d2).diff(dayjs(d1), 'day');

export const genId = (): string => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const calcLevel = (totalSpent: number): MemberLevel => {
  if (totalSpent >= 5000) return '钻石';
  if (totalSpent >= 2000) return '金卡';
  if (totalSpent >= 500) return '银卡';
  return '普通';
};

export const levelMultiplier = (level: MemberLevel): number => {
  const map: Record<MemberLevel, number> = { '普通': 1, '银卡': 1.2, '金卡': 1.5, '钻石': 2 };
  return map[level];
};

export const levelDiscount = (level: MemberLevel): number => {
  const map: Record<MemberLevel, number> = { '普通': 1, '银卡': 0.95, '金卡': 0.9, '钻石': 0.85 };
  return map[level];
};

export const checkAtRisk = (lastVisitDate: string): boolean => daysBetween(lastVisitDate) > 60;

export const calcCommission = (
  item: ServiceItem,
  quantity: number,
  actualAmount: number,
): number => {
  if (item.commissionType === 'fixed') return item.commissionValue * quantity;
  return Math.round(actualAmount * (item.commissionValue / 100) * 100) / 100;
};

export const buildTransactionItem = (
  service: ServiceItem,
  quantity: number,
  employeeId: string,
  employeeName: string,
  usePackage: boolean,
  packageId?: string,
): TransactionItem => {
  const rawAmount = service.price * quantity;
  const actual = usePackage ? 0 : rawAmount;
  return {
    serviceItemId: service.id,
    serviceItemName: service.name,
    price: service.price,
    quantity,
    employeeId,
    employeeName,
    usePackage,
    packageId,
    commissionAmount: usePackage
      ? Math.round(service.price * quantity * 0.1 * 100) / 100
      : calcCommission(service, quantity, actual),
  };
};

export const isBirthdayToday = (birthday: string): boolean => {
  const b = dayjs(birthday);
  const now = dayjs();
  return b.month() === now.month() && b.date() === now.date();
};

export const isBirthdayThisWeek = (birthday: string): boolean => {
  const b = dayjs(birthday).year(dayjs().year());
  const now = dayjs();
  const start = now.startOf('week');
  const end = now.endOf('week');
  return b.isAfter(start.subtract(1, 'day')) && b.isBefore(end.add(1, 'day'));
};

export const maskPhone = (phone: string): string =>
  phone.length >= 11 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;

export const levelColorClass: Record<MemberLevel, string> = {
  '普通': 'bg-stone-100 text-stone-600 border-stone-200',
  '银卡': 'bg-slate-100 text-slate-600 border-slate-300',
  '金卡': 'bg-amber-50 text-amber-700 border-amber-300',
  '钻石': 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-400',
};

export const levelBadgeStyle: Record<MemberLevel, string> = {
  '普通': 'bg-stone-500',
  '银卡': 'bg-slate-400',
  '金卡': 'bg-gradient-to-r from-amber-400 to-amber-500',
  '钻石': 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500',
};

export const updateMemberAfterTx = (
  m: Member,
  totalPaid: number,
  balanceUsed: number,
  pointsUsed: number,
  pointsEarned: number,
  visitCount: number,
): Member => {
  const newTotalSpent = m.totalSpent + totalPaid;
  const newLevel = calcLevel(newTotalSpent);
  return {
    ...m,
    balance: m.balance - balanceUsed,
    points: Math.max(0, m.points - pointsUsed) + pointsEarned,
    totalSpent: newTotalSpent,
    totalVisits: m.totalVisits + visitCount,
    level: newLevel,
    lastVisitDate: dayjs().toISOString(),
    isAtRisk: false,
  };
};
