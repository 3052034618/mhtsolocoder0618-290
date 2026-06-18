export type MemberLevel = '普通' | '银卡' | '金卡' | '钻石';

export interface Member {
  id: string;
  name: string;
  phone: string;
  gender: '男' | '女';
  birthday: string;
  avatar?: string;
  balance: number;
  points: number;
  level: MemberLevel;
  totalSpent: number;
  totalVisits: number;
  lastVisitDate: string;
  preferredStylistId?: string;
  allergies: string[];
  remark: string;
  createdAt: string;
  isAtRisk: boolean;
}

export type ServiceCategory = '美发' | '美容' | '美甲' | '护肤' | 'SPA' | '其他';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  price: number;
  duration: number;
  commissionType: 'percent' | 'fixed';
  commissionValue: number;
  isActive: boolean;
  desc?: string;
}

export interface PackageCard {
  id: string;
  memberId: string;
  serviceItemId: string;
  serviceItemName: string;
  totalCount: number;
  usedCount: number;
  purchaseDate: string;
  expireDate: string;
  purchasePrice: number;
}

export interface TransactionItem {
  serviceItemId: string;
  serviceItemName: string;
  price: number;
  quantity: number;
  employeeId: string;
  employeeName: string;
  usePackage: boolean;
  packageId?: string;
  commissionAmount: number;
  actualAmount?: number;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  items: TransactionItem[];
  subtotal: number;
  packageDeducted: number;
  pointsUsed: number;
  pointsEarned: number;
  balanceUsed: number;
  cashPaid: number;
  wechatPaid: number;
  alipayPaid: number;
  totalPaid: number;
  createdAt: string;
  createdBy: string;
}

export type EmployeeRole = 'admin' | 'senior' | 'stylist' | 'staff';

export interface Employee {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  password: string;
  position: string;
  hireDate: string;
  isActive: boolean;
  avatar?: string;
  baseSalary: number;
  commissionRate: number;
}

export interface DepositTier {
  amount: number;
  bonusAmount: number;
}

export interface PackageProduct {
  id: string;
  name: string;
  serviceItemId: string;
  serviceItemName: string;
  totalCount: number;
  bonusCount: number;
  price: number;
  validDays: number;
}

export interface Coupon {
  id: string;
  memberId: string;
  name: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  minAmount: number;
  expireDate: string;
  isUsed: boolean;
  createdAt: string;
}

export type AccountFlowType = 'deposit' | 'package_buy' | 'consume' | 'adjust';

export interface PaymentDetail {
  balancePaid: number;
  cashPaid: number;
  wechatPaid: number;
  alipayPaid: number;
}

export interface AccountFlow {
  id: string;
  memberId: string;
  memberName: string;
  type: AccountFlowType;
  title: string;
  amount: number;
  balanceChange: number;
  pointsChange: number;
  paymentDetail: PaymentDetail;
  operatorId: string;
  operatorName: string;
  transactionId?: string;
  packageCardId?: string;
  remark?: string;
  createdAt: string;
}
