/**
 * ユーザー管理用のモックデータ生成
 */

import type { User } from '@/types';

/**
 * モックユーザーデータ（SaaS割り当て用）
 */
export const mockUsers: Omit<User, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'user-1',
    name: '田中太郎',
    email: 'tanaka@example.com',
    department: '開発部',
    role: 'リーダー',
    status: 'active',
    phone: '090-1234-5001',
    hireDate: '2020-04-01',
  },
  {
    id: 'user-2',
    name: '佐藤花子',
    email: 'sato@example.com',
    department: '開発部',
    role: 'エンジニア',
    status: 'active',
    phone: '090-1234-5002',
    hireDate: '2021-04-01',
  },
  {
    id: 'user-3',
    name: '鈴木一郎',
    email: 'suzuki@example.com',
    department: '営業部',
    role: 'マネージャー',
    status: 'active',
    phone: '090-1234-5003',
    hireDate: '2019-04-01',
  },
  {
    id: 'user-4',
    name: '山田美咲',
    email: 'yamada@example.com',
    department: '営業部',
    role: '主任',
    status: 'active',
    phone: '090-1234-5004',
    hireDate: '2020-10-01',
  },
  {
    id: 'user-5',
    name: '伊藤健太',
    email: 'ito@example.com',
    department: '総務部',
    role: '課長',
    status: 'active',
    phone: '090-1234-5005',
    hireDate: '2018-04-01',
  },
  {
    id: 'user-6',
    name: '渡辺由美',
    email: 'watanabe@example.com',
    department: '総務部',
    role: '一般職',
    status: 'active',
    phone: '090-1234-5006',
    hireDate: '2022-04-01',
  },
  {
    id: 'user-7',
    name: '高橋直樹',
    email: 'takahashi@example.com',
    department: '経理部',
    role: '部長',
    status: 'active',
    phone: '090-1234-5007',
    hireDate: '2015-04-01',
  },
  {
    id: 'user-8',
    name: '小林恵子',
    email: 'kobayashi@example.com',
    department: '人事部',
    role: 'マネージャー',
    status: 'active',
    phone: '090-1234-5008',
    hireDate: '2019-10-01',
  },
  {
    id: 'user-9',
    name: '加藤修',
    email: 'kato@example.com',
    department: 'マーケティング部',
    role: 'リーダー',
    status: 'active',
    phone: '090-1234-5009',
    hireDate: '2020-07-01',
  },
  {
    id: 'user-10',
    name: '吉田真一',
    email: 'yoshida@example.com',
    department: '開発部',
    role: 'エンジニア',
    status: 'active',
    phone: '090-1234-5010',
    hireDate: '2021-10-01',
  },
  {
    id: 'user-11',
    name: '中村美穂',
    email: 'nakamura@example.com',
    department: 'デザイン部',
    role: 'デザイナー',
    status: 'active',
    phone: '090-1234-5011',
    hireDate: '2022-01-01',
  },
  {
    id: 'user-12',
    name: '木村拓也',
    email: 'kimura@example.com',
    department: 'デザイン部',
    role: 'アートディレクター',
    status: 'active',
    phone: '090-1234-5012',
    hireDate: '2020-04-01',
  },
  {
    id: 'user-13',
    name: '林真理子',
    email: 'hayashi@example.com',
    department: 'マーケティング部',
    role: 'マーケター',
    status: 'active',
    phone: '090-1234-5013',
    hireDate: '2021-07-01',
  },
  {
    id: 'user-14',
    name: '斎藤健',
    email: 'saito@example.com',
    department: '営業部',
    role: '営業',
    status: 'active',
    phone: '090-1234-5014',
    hireDate: '2023-04-01',
  },
  {
    id: 'user-15',
    name: '松本美香',
    email: 'matsumoto@example.com',
    department: '人事部',
    role: '採用担当',
    status: 'active',
    phone: '090-1234-5015',
    hireDate: '2022-10-01',
  },
];

/**
 * ユーザーストアを初期化
 */
export function initializeUserMockData(addUser: (user: Omit<User, 'createdAt' | 'updatedAt'>) => void) {
  mockUsers.forEach((user) => {
    addUser(user);
  });
}
