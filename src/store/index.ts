import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import type {
  Member, ServiceItem, Employee, Transaction, PackageCard,
  PackageProduct, DepositTier, Coupon, AccountFlow, PaymentDetail,
} from '@/types';
import {
  employees as defaultEmployees,
  serviceItems as defaultServices,
  packageProducts as defaultPkgProducts,
  depositTiers as defaultDepositTiers,
  generateMockMembers,
  generateMockTransactions,
  generateMockPackageCards,
  generateMockCoupons,
} from '@/data/mockData';
import { genId, checkAtRisk, calcLevel, levelMultiplier } from '@/utils';

interface AppState {
  initialized: boolean;
  currentEmployeeId: string | null;

  members: Member[];
  employees: Employee[];
  serviceItems: ServiceItem[];
  packageProducts: PackageProduct[];
  depositTiers: DepositTier[];
  transactions: Transaction[];
  packageCards: PackageCard[];
  coupons: Coupon[];
  accountFlows: AccountFlow[];

  currentUser: Employee | null;

  initData: (force?: boolean) => void;
  login: (phone: string, password: string) => Employee | null;
  logout: () => void;
  getCurrentEmployee: () => Employee | undefined;

  addAccountFlow: (f: Omit<AccountFlow, 'id' | 'createdAt'>) => AccountFlow;

  addMember: (m: Omit<Member, 'id' | 'createdAt' | 'level' | 'isAtRisk' | 'totalSpent' | 'totalVisits' | 'points' | 'balance' | 'lastVisitDate'>) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  refreshMemberRisk: () => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>, memberUpdates: {
    memberId: string; balanceUsed: number; pointsUsed: number; pointsEarned: number; totalPaid: number;
  }, packageDeductions: { packageCardId: string; count: number }[]) => Transaction;

  addBalance: (
    memberId: string, amount: number, bonus: number,
    paymentDetail: PaymentDetail, operatorId: string, operatorName: string,
  ) => AccountFlow;

  addPackageCard: (
    memberId: string, product: PackageProduct, paidAmount: number,
    paymentDetail: PaymentDetail, operatorId: string, operatorName: string,
  ) => { card: PackageCard; flow: AccountFlow; tx: Transaction };

  addCoupon: (c: Omit<Coupon, 'id' | 'createdAt'>) => void;

  addEmployee: (e: Omit<Employee, 'id'>) => Employee;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addService: (s: Omit<ServiceItem, 'id'>) => void;
  addServiceItem: (s: Omit<ServiceItem, 'id'>) => void;
  updateService: (id: string, patch: Partial<ServiceItem>) => void;
  updateServiceItem: (id: string, patch: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  setDepositTiers: (tiers: DepositTier[]) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      initialized: false,
      currentEmployeeId: null,
      members: [],
      employees: defaultEmployees,
      serviceItems: defaultServices,
      packageProducts: defaultPkgProducts,
      depositTiers: defaultDepositTiers,
      transactions: [],
      packageCards: [],
      coupons: [],
      accountFlows: [],

      get currentUser() {
        const s = get();
        return s.employees.find(e => e.id === s.currentEmployeeId) || null;
      },

      initData: (force = false) => {
        const s0 = get();
        // 不只是看initialized + members，综合判断已有任何真实数据就不重置
        const hasRealData = s0.members.length > 0
          || s0.accountFlows.length > 0
          || s0.transactions.length > 20
          || s0.packageCards.length > 0
          || s0.employees.length > defaultEmployees.length
          || JSON.stringify(s0.depositTiers) !== JSON.stringify(defaultDepositTiers)
          || s0.serviceItems.length > defaultServices.length;

        if (!force && hasRealData) {
          // 已有用户真实数据，只修正initialized标记，不覆盖数据
          if (!s0.initialized) {
            // 顺便refresh一下流失标记
            const refreshed = s0.members.map(m => ({ ...m, isAtRisk: checkAtRisk(m.lastVisitDate) }));
            set({ initialized: true, members: refreshed });
          } else {
            set({ initialized: true });
          }
          return;
        }

        // 真正初始化（force=true 或 数据为空）
        const members = generateMockMembers();
        const transactions = generateMockTransactions(members);
        const packageCards = generateMockPackageCards(members);
        const coupons = generateMockCoupons(members);
        members.forEach(m => { m.isAtRisk = checkAtRisk(m.lastVisitDate); });

        // 生成账户流水mock：把储值充值和套餐购买用accountFlow记录一遍
        const flows: AccountFlow[] = [];
        const now = dayjs();

        // 为部分随机会员生成充值流水
        const mockEmp = defaultEmployees[1] || defaultEmployees[0];
        members.forEach(m => {
          if (m.balance > 0) {
            const amt = m.balance;
            const bonus = Math.round(amt * 0.1);
            const date = now.subtract(10 + Math.floor(Math.random() * 150), 'day').toISOString();
            flows.push({
              id: 'af' + genId(),
              memberId: m.id, memberName: m.name,
              type: 'deposit',
              title: `储值充值 ¥${amt}（送¥${bonus}）`,
              amount: amt,
              balanceChange: amt + bonus,
              pointsChange: Math.floor(amt / 10 * levelMultiplier(m.level)),
              paymentDetail: { balancePaid: 0, cashPaid: amt, wechatPaid: 0, alipayPaid: 0 },
              operatorId: mockEmp.id, operatorName: mockEmp.name,
              createdAt: date,
            });
          }
        });
        // 为套餐卡生成购买流水
        packageCards.forEach(pc => {
          const date = pc.purchaseDate;
          flows.push({
            id: 'af' + genId(),
            memberId: pc.memberId,
            memberName: members.find(m => m.id === pc.memberId)?.name || '',
            type: 'package_buy',
            title: `${pc.serviceItemName} 套餐卡购买（${pc.totalCount}次）`,
            amount: pc.purchasePrice,
            balanceChange: 0,
            pointsChange: Math.floor(pc.purchasePrice / 10),
            paymentDetail: { balancePaid: 0, cashPaid: pc.purchasePrice, wechatPaid: 0, alipayPaid: 0 },
            operatorId: mockEmp.id, operatorName: mockEmp.name,
            packageCardId: pc.id,
            createdAt: date,
          });
        });
        // 生成消费流水（对应Transaction中实际支付的部分）
        transactions.forEach(tx => {
          const realPay = tx.totalPaid;
          if (realPay <= 0) return;
          flows.push({
            id: 'af' + genId(),
            memberId: tx.memberId,
            memberName: tx.memberName,
            type: 'consume',
            title: `消费结账（${tx.items.length}项服务）`,
            amount: -realPay,
            balanceChange: -tx.balanceUsed,
            pointsChange: tx.pointsEarned - tx.pointsUsed,
            paymentDetail: {
              balancePaid: tx.balanceUsed,
              cashPaid: tx.cashPaid,
              wechatPaid: tx.wechatPaid,
              alipayPaid: tx.alipayPaid,
            },
            operatorId: tx.createdBy,
            operatorName: defaultEmployees.find(e => e.id === tx.createdBy)?.name || mockEmp.name,
            transactionId: tx.id,
            createdAt: tx.createdAt,
          });
        });

        // 按时间倒序排
        flows.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

        set({
          initialized: true,
          members,
          transactions,
          packageCards,
          coupons,
          accountFlows: flows,
          employees: defaultEmployees,
          serviceItems: defaultServices,
          packageProducts: defaultPkgProducts,
          depositTiers: defaultDepositTiers,
        });
      },

      login: (phone, password) => {
        const emp = get().employees.find(e => e.phone === phone && e.password === password && e.isActive);
        if (emp) set({ currentEmployeeId: emp.id });
        return emp || null;
      },
      logout: () => set({ currentEmployeeId: null }),
      getCurrentEmployee: () => get().employees.find(e => e.id === get().currentEmployeeId),

      addAccountFlow: (f) => {
        const flow: AccountFlow = { ...f, id: 'af' + genId(), createdAt: dayjs().toISOString() };
        set(s => ({ accountFlows: [flow, ...s.accountFlows] }));
        return flow;
      },

      addMember: (m) => {
        const now = dayjs().toISOString();
        const member: Member = {
          ...m,
          id: 'm' + genId(),
          createdAt: now,
          balance: 0,
          points: 0,
          level: '普通',
          totalSpent: 0,
          totalVisits: 0,
          lastVisitDate: now,
          isAtRisk: false,
        };
        set(s => ({ members: [member, ...s.members] }));
        return member;
      },
      updateMember: (id, patch) => set(s => ({
        members: s.members.map(m => m.id === id ? { ...m, ...patch } : m),
      })),
      refreshMemberRisk: () => set(s => ({
        members: s.members.map(m => ({ ...m, isAtRisk: checkAtRisk(m.lastVisitDate) })),
      })),

      addTransaction: (tx, mu, deductions) => {
        const now = dayjs().toISOString();
        const newTx: Transaction = { ...tx, id: 'tx' + genId(), createdAt: now };
        set(s => {
          let newPackageCards = s.packageCards;
          if (deductions.length > 0) {
            newPackageCards = s.packageCards.map(pc => {
              const ded = deductions.find(d => d.packageCardId === pc.id);
              return ded ? { ...pc, usedCount: pc.usedCount + ded.count } : pc;
            });
          }
          const newMembers = s.members.map(m => {
            if (m.id !== mu.memberId) return m;
            const newTotalSpent = m.totalSpent + mu.totalPaid;
            const newLevel = calcLevel(newTotalSpent);
            return {
              ...m,
              balance: m.balance - mu.balanceUsed,
              points: Math.max(0, m.points - mu.pointsUsed) + mu.pointsEarned,
              totalSpent: newTotalSpent,
              totalVisits: m.totalVisits + 1,
              level: newLevel,
              lastVisitDate: now,
              isAtRisk: false,
            };
          });
          // 组装消费流水
          const empName = s.employees.find(e => e.id === tx.createdBy)?.name || '-';
          const realPay = mu.totalPaid;
          const flow: AccountFlow = {
            id: 'af' + genId(),
            memberId: mu.memberId,
            memberName: tx.memberName,
            type: 'consume',
            title: `消费结账（${tx.items.length}项服务）`,
            amount: -realPay,
            balanceChange: -mu.balanceUsed,
            pointsChange: mu.pointsEarned - mu.pointsUsed,
            paymentDetail: {
              balancePaid: mu.balanceUsed,
              cashPaid: tx.cashPaid,
              wechatPaid: tx.wechatPaid,
              alipayPaid: tx.alipayPaid,
            },
            operatorId: tx.createdBy,
            operatorName: empName,
            transactionId: newTx.id,
            createdAt: now,
          };
          return {
            transactions: [newTx, ...s.transactions],
            members: newMembers,
            packageCards: newPackageCards,
            accountFlows: [flow, ...s.accountFlows],
          };
        });
        return newTx;
      },

      addBalance: (memberId, amount, bonus, paymentDetail, operatorId, operatorName) => {
        const now = dayjs().toISOString();
        const member = get().members.find(m => m.id === memberId);
        const multiplier = member ? levelMultiplier(member.level) : 1;
        const pointsEarned = Math.floor(amount / 10 * multiplier);
        set(s => ({
          members: s.members.map(m => m.id === memberId
            ? { ...m, balance: m.balance + amount + bonus, points: m.points + pointsEarned }
            : m),
        }));
        const flow: AccountFlow = {
          id: 'af' + genId(),
          memberId,
          memberName: member?.name || '',
          type: 'deposit',
          title: `储值充值 ¥${amount}${bonus ? `（赠¥${bonus}）` : ''}`,
          amount,
          balanceChange: amount + bonus,
          pointsChange: pointsEarned,
          paymentDetail,
          operatorId,
          operatorName,
          createdAt: now,
        };
        set(s => ({ accountFlows: [flow, ...s.accountFlows] }));
        return flow;
      },

      addPackageCard: (memberId, product, paidAmount, paymentDetail, operatorId, operatorName) => {
        const now = dayjs();
        const member = get().members.find(m => m.id === memberId);
        const card: PackageCard = {
          id: 'pc' + genId(),
          memberId,
          serviceItemId: product.serviceItemId,
          serviceItemName: product.serviceItemName,
          totalCount: product.totalCount + product.bonusCount,
          usedCount: 0,
          purchaseDate: now.toISOString(),
          expireDate: now.add(product.validDays, 'day').toISOString(),
          purchasePrice: paidAmount,
        };
        set(s => ({ packageCards: [card, ...s.packageCards] }));

        const multiplier = member ? levelMultiplier(member.level) : 1;
        const pointsEarned = Math.floor(paidAmount / 10 * multiplier);

        // 同时记一条消费transaction（套餐购买行为，用于看板统计）
        const tx: Transaction = {
          id: 'tx' + genId(),
          memberId,
          memberName: member?.name || '',
          items: [{
            serviceItemId: product.serviceItemId,
            serviceItemName: `${product.name}购买`,
            price: paidAmount,
            quantity: 1,
            employeeId: operatorId,
            employeeName: operatorName,
            usePackage: false,
            commissionAmount: Math.round(paidAmount * 0.05 * 100) / 100,
            actualAmount: paidAmount,
          }],
          subtotal: paidAmount,
          packageDeducted: 0,
          pointsUsed: 0,
          pointsEarned,
          balanceUsed: paymentDetail.balancePaid,
          cashPaid: paymentDetail.cashPaid,
          wechatPaid: paymentDetail.wechatPaid,
          alipayPaid: paymentDetail.alipayPaid,
          totalPaid: paidAmount,
          createdAt: now.toISOString(),
          createdBy: operatorId,
        };
        set(s => ({
          transactions: [tx, ...s.transactions],
          members: s.members.map(m => {
            if (m.id !== memberId) return m;
            const newTotal = m.totalSpent + paidAmount;
            return {
              ...m,
              balance: m.balance - paymentDetail.balancePaid + pointsEarned * 0,
              points: m.points + pointsEarned,
              totalSpent: newTotal,
              level: calcLevel(newTotal),
            };
          }),
        }));

        const flow: AccountFlow = {
          id: 'af' + genId(),
          memberId,
          memberName: member?.name || '',
          type: 'package_buy',
          title: `${product.name} 套餐购买（${product.totalCount + product.bonusCount}次）`,
          amount: paidAmount,
          balanceChange: -paymentDetail.balancePaid,
          pointsChange: pointsEarned,
          paymentDetail,
          operatorId,
          operatorName,
          packageCardId: card.id,
          createdAt: now.toISOString(),
        };
        set(s => ({ accountFlows: [flow, ...s.accountFlows] }));
        return { card, flow, tx };
      },

      addCoupon: (c) => set(s => ({
        coupons: [{ ...c, id: 'cp' + genId(), createdAt: dayjs().toISOString() }, ...s.coupons],
      })),

      addEmployee: (e) => {
        const emp: Employee = { ...e, id: 'e' + genId() };
        set(s => ({ employees: [...s.employees, emp] }));
        return emp;
      },
      updateEmployee: (id, patch) => set(s => ({
        employees: s.employees.map(e => e.id === id ? { ...e, ...patch } : e),
      })),
      deleteEmployee: (id) => set(s => ({
        employees: s.employees.filter(e => e.id !== id),
      })),

      addService: (svc) => set(st => ({
        serviceItems: [...st.serviceItems, { ...svc, id: 'svc' + genId() }],
      })),
      addServiceItem: (svc) => set(st => ({
        serviceItems: [...st.serviceItems, { ...svc, id: 'svc' + genId() }],
      })),
      updateService: (id, patch) => set(s => ({
        serviceItems: s.serviceItems.map(it => it.id === id ? { ...it, ...patch } : it),
      })),
      updateServiceItem: (id, patch) => set(s => ({
        serviceItems: s.serviceItems.map(it => it.id === id ? { ...it, ...patch } : it),
      })),
      deleteService: (id) => set(s => ({
        serviceItems: s.serviceItems.filter(it => it.id !== id),
      })),
      setDepositTiers: (tiers) => set({ depositTiers: tiers }),
    }),
    { name: 'salon-ms-storage' },
  ),
);
