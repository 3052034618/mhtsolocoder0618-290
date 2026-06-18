import dayjs from 'dayjs';
import type {
  Member, ServiceItem, Employee, Transaction, PackageCard,
  PackageProduct, DepositTier, Coupon,
} from '@/types';
import { calcLevel, genId } from '@/utils';

export const depositTiers: DepositTier[] = [
  { amount: 300, bonusAmount: 30 },
  { amount: 500, bonusAmount: 80 },
  { amount: 1000, bonusAmount: 200 },
  { amount: 2000, bonusAmount: 500 },
  { amount: 5000, bonusAmount: 1500 },
];

export const serviceItems: ServiceItem[] = [
  { id: 'svc1', name: '精剪造型', category: '美发', price: 68, duration: 45, commissionType: 'percent', commissionValue: 30, isActive: true },
  { id: 'svc2', name: '女士长发精剪', category: '美发', price: 98, duration: 60, commissionType: 'percent', commissionValue: 30, isActive: true },
  { id: 'svc3', name: '男士剪发', category: '美发', price: 48, duration: 30, commissionType: 'percent', commissionValue: 30, isActive: true },
  { id: 'svc4', name: '染发（中短发）', category: '美发', price: 298, duration: 90, commissionType: 'percent', commissionValue: 25, isActive: true },
  { id: 'svc5', name: '染发（长发）', category: '美发', price: 458, duration: 120, commissionType: 'percent', commissionValue: 25, isActive: true },
  { id: 'svc6', name: '烫发（中短发）', category: '美发', price: 388, duration: 120, commissionType: 'percent', commissionValue: 25, isActive: true },
  { id: 'svc7', name: '烫发（长发）', category: '美发', price: 568, duration: 150, commissionType: 'percent', commissionValue: 25, isActive: true },
  { id: 'svc8', name: '头皮护理SPA', category: '美发', price: 188, duration: 60, commissionType: 'percent', commissionValue: 35, isActive: true },
  { id: 'svc9', name: '面部补水护理', category: '美容', price: 198, duration: 60, commissionType: 'percent', commissionValue: 35, isActive: true },
  { id: 'svc10', name: '深层清洁护理', category: '美容', price: 288, duration: 75, commissionType: 'percent', commissionValue: 35, isActive: true },
  { id: 'svc11', name: '抗衰紧致护理', category: '美容', price: 488, duration: 90, commissionType: 'percent', commissionValue: 30, isActive: true },
  { id: 'svc12', name: '手部美甲（单色）', category: '美甲', price: 88, duration: 45, commissionType: 'fixed', commissionValue: 20, isActive: true },
  { id: 'svc13', name: '手部美甲（款式）', category: '美甲', price: 168, duration: 75, commissionType: 'fixed', commissionValue: 40, isActive: true },
  { id: 'svc14', name: '足部美甲', category: '美甲', price: 128, duration: 60, commissionType: 'fixed', commissionValue: 30, isActive: true },
  { id: 'svc15', name: '洗吹造型', category: '美发', price: 38, duration: 25, commissionType: 'fixed', commissionValue: 10, isActive: true },
];

export const packageProducts: PackageProduct[] = [
  { id: 'pkg1', name: '洗剪吹套餐', serviceItemId: 'svc1', serviceItemName: '精剪造型', totalCount: 10, bonusCount: 2, price: 580, validDays: 365 },
  { id: 'pkg2', name: '洗剪吹基础套餐', serviceItemId: 'svc3', serviceItemName: '男士剪发', totalCount: 10, bonusCount: 2, price: 398, validDays: 365 },
  { id: 'pkg3', name: '染发超值套餐', serviceItemId: 'svc4', serviceItemName: '染发（中短发）', totalCount: 3, bonusCount: 1, price: 798, validDays: 365 },
  { id: 'pkg4', name: '烫发护理套餐', serviceItemId: 'svc6', serviceItemName: '烫发（中短发）', totalCount: 3, bonusCount: 1, price: 1080, validDays: 365 },
  { id: 'pkg5', name: '头皮SPA护理卡', serviceItemId: 'svc8', serviceItemName: '头皮护理SPA', totalCount: 10, bonusCount: 3, price: 1580, validDays: 365 },
  { id: 'pkg6', name: '面部补水年卡', serviceItemId: 'svc9', serviceItemName: '面部补水护理', totalCount: 12, bonusCount: 4, price: 1980, validDays: 365 },
  { id: 'pkg7', name: '美甲畅做卡', serviceItemId: 'svc12', serviceItemName: '手部美甲（单色）', totalCount: 12, bonusCount: 3, price: 880, validDays: 365 },
];

export const employees: Employee[] = [
  { id: 'emp0', name: '超级管理员', phone: '13800000000', role: 'admin', password: 'admin123', position: '店主', hireDate: '2023-01-01', isActive: true, baseSalary: 10000, commissionRate: 15 },
  { id: 'emp1', name: '林雅', phone: '13800000001', role: 'admin', password: '123456', position: '首席发型师', hireDate: '2023-03-15', isActive: true, baseSalary: 8000, commissionRate: 30 },
  { id: 'emp2', name: '陈思', phone: '13800000002', role: 'senior', password: '123456', position: '高级发型师', hireDate: '2023-05-20', isActive: true, baseSalary: 6000, commissionRate: 25 },
  { id: 'emp3', name: '王美丽', phone: '13800000003', role: 'stylist', password: '123456', position: '美容师', hireDate: '2023-07-10', isActive: true, baseSalary: 5000, commissionRate: 22 },
  { id: 'emp4', name: '刘芳', phone: '13800000004', role: 'stylist', password: '123456', position: '美甲师', hireDate: '2023-09-01', isActive: true, baseSalary: 4500, commissionRate: 20 },
  { id: 'emp5', name: '张磊', phone: '13800000005', role: 'staff', password: '123456', position: '发型技师', hireDate: '2024-01-15', isActive: true, baseSalary: 3500, commissionRate: 10 },
];

const firstNames = ['晓', '雨', '思', '佳', '梦', '婉', '诗', '欣', '怡', '雅', '琳', '雪', '美', '丽', '芳', '娜', '敏', '静', '莉', '娟'];
const lastNames = ['王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗'];
const genName = (g: '男' | '女') => {
  const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
  if (g === '男') {
    const fns = ['伟', '强', '磊', '军', '鹏', '涛', '超', '杰', '浩', '宇', '轩', '博'];
    return ln + fns[Math.floor(Math.random() * fns.length)] + (Math.random() > 0.5 ? fns[Math.floor(Math.random() * fns.length)] : '');
  }
  return ln + firstNames[Math.floor(Math.random() * firstNames.length)] + (Math.random() > 0.5 ? firstNames[Math.floor(Math.random() * firstNames.length)] : '');
};

const genPhone = () => '1' + (Math.random() > 0.5 ? '3' : '5') + (8 + Math.floor(Math.random() * 2)) + Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');

const allergyPool = ['染发剂过敏', '香精过敏', '酒精过敏', '花粉过敏', '金属过敏', '无'];

export const generateMockMembers = (): Member[] => {
  const members: Member[] = [];
  const now = dayjs();
  for (let i = 0; i < 35; i++) {
    const gender: '男' | '女' = Math.random() > 0.35 ? '女' : '男';
    const totalSpent = Math.round(Math.random() * 8000);
    const totalVisits = 1 + Math.floor(Math.random() * 30);
    const daysAgo = Math.floor(Math.random() * 180);
    const lastVisit = now.subtract(daysAgo, 'day').toISOString();
    const createDaysAgo = 30 + Math.floor(Math.random() * 400);
    const allergy = allergyPool[Math.floor(Math.random() * allergyPool.length)];
    const birthMonth = Math.floor(Math.random() * 12) + 1;
    const birthDay = Math.floor(Math.random() * 28) + 1;
    members.push({
      id: 'm' + (i + 1),
      name: genName(gender),
      phone: genPhone(),
      gender,
      birthday: `19${85 + Math.floor(Math.random() * 25)}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      balance: Math.random() > 0.4 ? Math.round(Math.random() * 3000) : 0,
      points: Math.round(Math.random() * 5000),
      level: calcLevel(totalSpent),
      totalSpent,
      totalVisits,
      lastVisitDate: lastVisit,
      preferredStylistId: Math.random() > 0.5 ? employees[1 + Math.floor(Math.random() * (employees.length - 1))].id : undefined,
      allergies: allergy === '无' ? [] : [allergy],
      remark: Math.random() > 0.7 ? '老顾客，服务需细致' : '',
      createdAt: now.subtract(createDaysAgo, 'day').toISOString(),
      isAtRisk: daysAgo > 60,
    });
  }
  return members;
};

export const generateMockTransactions = (members: Member[]): Transaction[] => {
  const now = dayjs();
  const txs: Transaction[] = [];
  const staffIds = employees.filter(e => e.role === 'staff').map(e => e.id);
  const allEmpIds = employees.map(e => e.id);

  members.forEach(m => {
    const visitCount = Math.min(m.totalVisits, 15);
    for (let v = 0; v < visitCount; v++) {
      const daysAgo = Math.floor((m.totalVisits > 0 ? (now.diff(dayjs(m.lastVisitDate), 'day') / m.totalVisits) * v : 0)) + Math.floor(Math.random() * 5);
      const txDate = now.subtract(daysAgo, 'day').hour(10 + Math.floor(Math.random() * 10)).minute(Math.floor(Math.random() * 60));
      const numItems = 1 + Math.floor(Math.random() * 3);
      const items: Transaction['items'] = [];
      let subtotal = 0;
      for (let i = 0; i < numItems; i++) {
        const svc = serviceItems[Math.floor(Math.random() * serviceItems.length)];
        const qty = Math.random() > 0.9 ? 2 : 1;
        const empId = allEmpIds[Math.floor(Math.random() * allEmpIds.length)];
        const emp = employees.find(e => e.id === empId)!;
        const usePkg = false;
        const amt = svc.price * qty;
        subtotal += amt;
        items.push({
          serviceItemId: svc.id,
          serviceItemName: svc.name,
          price: svc.price,
          quantity: qty,
          employeeId: empId,
          employeeName: emp.name,
          usePackage: usePkg,
          commissionAmount: svc.commissionType === 'fixed'
            ? svc.commissionValue * qty
            : Math.round(amt * svc.commissionValue / 100 * 100) / 100,
        });
      }
      const useBalance = Math.random() > 0.5 && m.balance > 0;
      const totalPaid = subtotal;
      const balanceUsed = useBalance ? Math.min(m.balance, totalPaid) : 0;
      const rest = totalPaid - balanceUsed;
      const byCash = Math.random() > 0.5 ? 0 : rest;
      const byWechat = rest - byCash > 0 && Math.random() > 0.5 ? rest - byCash : 0;
      const byAlipay = rest - balanceUsed - byCash - byWechat;
      txs.push({
        id: 'tx' + genId(),
        memberId: m.id,
        memberName: m.name,
        items,
        subtotal,
        packageDeducted: 0,
        pointsUsed: 0,
        pointsEarned: Math.round(balanceUsed * 1.2),
        balanceUsed,
        cashPaid: byCash,
        wechatPaid: byWechat,
        alipayPaid: byAlipay,
        totalPaid,
        createdAt: txDate.toISOString(),
        createdBy: staffIds[Math.floor(Math.random() * staffIds.length)],
      });
    }
  });
  return txs.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
};

export const generateMockPackageCards = (members: Member[]): PackageCard[] => {
  const cards: PackageCard[] = [];
  const now = dayjs();
  members.forEach(m => {
    if (Math.random() < 0.4) {
      const numPkg = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numPkg; i++) {
        const prod = packageProducts[Math.floor(Math.random() * packageProducts.length)];
        const total = prod.totalCount + prod.bonusCount;
        const used = Math.floor(Math.random() * (total + 1));
        const purDate = now.subtract(30 + Math.floor(Math.random() * 200), 'day');
        cards.push({
          id: 'pc' + genId(),
          memberId: m.id,
          serviceItemId: prod.serviceItemId,
          serviceItemName: prod.serviceItemName,
          totalCount: total,
          usedCount: used,
          purchaseDate: purDate.toISOString(),
          expireDate: purDate.add(prod.validDays, 'day').toISOString(),
          purchasePrice: prod.price,
        });
      }
    }
  });
  return cards;
};

export const generateMockCoupons = (members: Member[]): Coupon[] => {
  const now = dayjs();
  const coupons: Coupon[] = [];
  members.forEach(m => {
    if (Math.random() < 0.3) {
      coupons.push({
        id: 'cp' + genId(),
        memberId: m.id,
        name: '新人专享券',
        discountType: 'fixed',
        discountValue: 30,
        minAmount: 100,
        expireDate: now.add(30, 'day').toISOString(),
        isUsed: Math.random() > 0.5,
        createdAt: now.toISOString(),
      });
    }
  });
  return coupons;
};
