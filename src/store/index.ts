import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import type {
  Member, ServiceItem, Employee, Transaction, PackageCard,
  PackageProduct, DepositTier, Coupon,
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
import { genId, checkAtRisk, calcLevel } from '@/utils';

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

  currentUser: Employee | null;

  initData: () => void;
  login: (phone: string, password: string) => Employee | null;
  logout: () => void;
  getCurrentEmployee: () => Employee | undefined;

  addMember: (m: Omit<Member, 'id' | 'createdAt' | 'level' | 'isAtRisk' | 'totalSpent' | 'totalVisits' | 'points' | 'balance' | 'lastVisitDate'>) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  refreshMemberRisk: () => void;

  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>, memberUpdates: {
    memberId: string; balanceUsed: number; pointsUsed: number; pointsEarned: number; totalPaid: number;
  }, packageDeductions: { packageCardId: string; count: number }[]) => void;

  addBalance: (memberId: string, amount: number, bonus: number) => void;
  addPackageCard: (memberId: string, product: PackageProduct, paidAmount: number) => void;
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

      get currentUser() {
        const s = get();
        return s.employees.find(e => e.id === s.currentEmployeeId) || null;
      },

      initData: () => {
        const s0 = get();
        if (s0.initialized && s0.members.length > 0) {
          // 已有用户真实数据，不重新覆盖
          set({ initialized: true });
          return;
        }
        const members = generateMockMembers();
        const transactions = generateMockTransactions(members);
        const packageCards = generateMockPackageCards(members);
        const coupons = generateMockCoupons(members);
        members.forEach(m => { m.isAtRisk = checkAtRisk(m.lastVisitDate); });
        set({
          initialized: true,
          members,
          transactions,
          packageCards,
          coupons,
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
          return {
            transactions: [newTx, ...s.transactions],
            members: newMembers,
            packageCards: newPackageCards,
          };
        });
      },

      addBalance: (memberId, amount, bonus) => set(s => ({
        members: s.members.map(m => m.id === memberId
          ? { ...m, balance: m.balance + amount + bonus }
          : m),
      })),
      addPackageCard: (memberId, product, paidAmount) => {
        const now = dayjs();
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
