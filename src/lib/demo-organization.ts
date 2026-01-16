import type { OrganizationNode, OrganizationMember, TransferHistory } from '@/types';
// UserRole - 型定義として将来使用予定

// デモ組織メンバー
export const demoMembers: OrganizationMember[] = [
  // 経営陣
  {
    id: 'ceo-001',
    name: '鈴木太郎',
    email: 'suzuki.taro@dandori.com',
    position: '代表取締役社長',
    role: 'admin',
    avatar: '',
    isManager: true,
    joinDate: '2015-04-01',
    status: 'active'
  },
  {
    id: 'cto-001',
    name: '田中花子',
    email: 'tanaka.hanako@dandori.com',
    position: '最高技術責任者',
    role: 'admin',
    avatar: '',
    isManager: true,
    joinDate: '2016-04-01',
    status: 'active'
  },

  // 人事部
  {
    id: 'hr-001',
    name: '山田次郎',
    email: 'yamada.jiro@dandori.com',
    position: '人事部長',
    role: 'hr',
    avatar: '',
    isManager: true,
    joinDate: '2018-04-01',
    status: 'active'
  },
  {
    id: 'hr-002',
    name: '佐藤美咲',
    email: 'sato.misaki@dandori.com',
    position: '人事担当',
    role: 'hr',
    avatar: '',
    isManager: false,
    joinDate: '2020-04-01',
    status: 'active'
  },
  {
    id: 'hr-003',
    name: '高橋健一',
    email: 'takahashi.kenichi@dandori.com',
    position: '労務担当',
    role: 'hr',
    avatar: '',
    isManager: false,
    joinDate: '2021-04-01',
    status: 'active'
  },

  // 開発部
  {
    id: 'dev-001',
    name: '伊藤大輔',
    email: 'ito.daisuke@dandori.com',
    position: '開発部長',
    role: 'manager',
    avatar: '',
    isManager: true,
    joinDate: '2017-04-01',
    status: 'active'
  },
  {
    id: 'dev-002',
    name: '渡辺真一',
    email: 'watanabe.shinichi@dandori.com',
    position: 'シニアエンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2019-04-01',
    status: 'active'
  },
  {
    id: 'dev-003',
    name: '中村あゆみ',
    email: 'nakamura.ayumi@dandori.com',
    position: 'フロントエンドエンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2020-04-01',
    status: 'active'
  },
  {
    id: 'dev-004',
    name: '小林正樹',
    email: 'kobayashi.masaki@dandori.com',
    position: 'バックエンドエンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2021-04-01',
    status: 'active'
  },
  {
    id: 'dev-005',
    name: '加藤由美',
    email: 'kato.yumi@dandori.com',
    position: 'UIデザイナー',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },

  // フロントエンドチーム
  {
    id: 'fe-001',
    name: '松本和也',
    email: 'matsumoto.kazuya@dandori.com',
    position: 'フロントエンドチームリーダー',
    role: 'manager',
    avatar: '',
    isManager: true,
    joinDate: '2018-04-01',
    status: 'active'
  },
  {
    id: 'fe-002',
    name: '井上麻衣',
    email: 'inoue.mai@dandori.com',
    position: 'React開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2021-04-01',
    status: 'active'
  },

  // バックエンドチーム
  {
    id: 'be-001',
    name: '木村信夫',
    email: 'kimura.nobuo@dandori.com',
    position: 'バックエンドチームリーダー',
    role: 'manager',
    avatar: '',
    isManager: true,
    joinDate: '2018-04-01',
    status: 'active'
  },
  {
    id: 'be-002',
    name: '林香織',
    email: 'hayashi.kaori@dandori.com',
    position: 'Node.js開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2020-04-01',
    status: 'active'
  },

  // 営業部
  {
    id: 'sales-001',
    name: '森田浩司',
    email: 'morita.koji@dandori.com',
    position: '営業部長',
    role: 'manager',
    avatar: '',
    isManager: true,
    joinDate: '2017-04-01',
    status: 'active'
  },
  {
    id: 'sales-002',
    name: '清水典子',
    email: 'shimizu.noriko@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2019-04-01',
    status: 'active'
  },
  {
    id: 'sales-003',
    name: '藤田雅人',
    email: 'fujita.masato@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2020-04-01',
    status: 'active'
  },

  // マーケティング部
  {
    id: 'marketing-001',
    name: '原田智美',
    email: 'harada.tomomi@dandori.com',
    position: 'マーケティング部長',
    role: 'manager',
    avatar: '',
    isManager: true,
    joinDate: '2018-04-01',
    status: 'active'
  },
  {
    id: 'marketing-002',
    name: '長谷川修',
    email: 'hasegawa.osamu@dandori.com',
    position: 'デジタルマーケティング担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2021-04-01',
    status: 'active'
  },

  // 追加メンバー (20-50人目)
  {
    id: 'dev-006',
    name: '岡田聡',
    email: 'okada.satoshi@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'dev-007',
    name: '松井由香',
    email: 'matsui.yuka@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'dev-008',
    name: '野村健',
    email: 'nomura.ken@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'dev-009',
    name: '池田真理',
    email: 'ikeda.mari@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'dev-010',
    name: '久保田修',
    email: 'kubota.osamu@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'sales-004',
    name: '前田亮',
    email: 'maeda.ryo@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2021-04-01',
    status: 'active'
  },
  {
    id: 'sales-005',
    name: '藤原美穂',
    email: 'fujiwara.miho@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'sales-006',
    name: '石川浩二',
    email: 'ishikawa.koji@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'sales-007',
    name: '坂本愛',
    email: 'sakamoto.ai@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'sales-008',
    name: '近藤誠',
    email: 'kondo.makoto@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'hr-004',
    name: '村上綾香',
    email: 'murakami.ayaka@dandori.com',
    position: '人事担当',
    role: 'hr',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'hr-005',
    name: '竹内隆史',
    email: 'takeuchi.takashi@dandori.com',
    position: '人事担当',
    role: 'hr',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'marketing-003',
    name: '須藤麗',
    email: 'sudo.rei@dandori.com',
    position: 'マーケティング担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'marketing-004',
    name: '宮崎太一',
    email: 'miyazaki.taichi@dandori.com',
    position: 'マーケティング担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'marketing-005',
    name: '大野由紀',
    email: 'ono.yuki@dandori.com',
    position: 'マーケティング担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'fe-003',
    name: '谷口信夫',
    email: 'taniguchi.nobuo@dandori.com',
    position: 'フロントエンド開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'fe-004',
    name: '西村香織',
    email: 'nishimura.kaori@dandori.com',
    position: 'フロントエンド開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'fe-005',
    name: '上田拓也',
    email: 'ueda.takuya@dandori.com',
    position: 'フロントエンド開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'be-003',
    name: '金子美和',
    email: 'kaneko.miwa@dandori.com',
    position: 'バックエンド開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'be-004',
    name: '三浦健太郎',
    email: 'miura.kentaro@dandori.com',
    position: 'バックエンド開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2022-04-01',
    status: 'active'
  },
  {
    id: 'be-005',
    name: '内田千鶴',
    email: 'uchida.chizuru@dandori.com',
    position: 'バックエンド開発者',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'dev-011',
    name: '今井俊介',
    email: 'imai.shunsuke@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'dev-012',
    name: '杉本直子',
    email: 'sugimoto.naoko@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'dev-013',
    name: '横山勇',
    email: 'yokoyama.isamu@dandori.com',
    position: 'エンジニア',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'sales-009',
    name: '長野浩',
    email: 'nagano.hiroshi@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'sales-010',
    name: '藤井瞳',
    email: 'fujii.hitomi@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'sales-011',
    name: '本田雅彦',
    email: 'honda.masahiko@dandori.com',
    position: '営業担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2024-04-01',
    status: 'active'
  },
  {
    id: 'hr-006',
    name: '安藤理恵',
    email: 'ando.rie@dandori.com',
    position: '人事担当',
    role: 'hr',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'marketing-006',
    name: '柴田浩司',
    email: 'shibata.koji@dandori.com',
    position: 'マーケティングマネージャー',
    role: 'manager',
    avatar: '',
    isManager: true,
    joinDate: '2019-04-01',
    status: 'active'
  },
  {
    id: 'marketing-007',
    name: '河合あゆみ',
    email: 'kawai.ayumi@dandori.com',
    position: 'マーケティング担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2023-04-01',
    status: 'active'
  },
  {
    id: 'marketing-008',
    name: '片岡大輔',
    email: 'kataoka.daisuke@dandori.com',
    position: 'マーケティング担当',
    role: 'employee',
    avatar: '',
    isManager: false,
    joinDate: '2024-04-01',
    status: 'active'
  }
];

// メンバーを取得するヘルパー関数
const getMemberById = (id: string): OrganizationMember | undefined => 
  demoMembers.find(m => m.id === id);

const getMembersByIds = (ids: string[]): OrganizationMember[] =>
  ids.map(id => getMemberById(id)).filter(Boolean) as OrganizationMember[];

// デモ組織構造
export const demoOrganizationTree: OrganizationNode = {
  id: 'company',
  name: 'ダンドリ株式会社',
  type: 'company',
  level: 0,
  memberCount: demoMembers.length,
  description: '効率的な人事管理システムを提供するテクノロジー企業',
  members: getMembersByIds(['ceo-001', 'cto-001']),
  headMember: getMemberById('ceo-001'),
  children: [
    {
      id: 'hr-division',
      name: '人事部',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 6,
      description: '人事・労務管理全般を担当',
      members: getMembersByIds(['hr-001', 'hr-002', 'hr-003', 'hr-004', 'hr-005', 'hr-006']),
      headMember: getMemberById('hr-001'),
      children: []
    },
    {
      id: 'tech-division',
      name: '技術部門',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 22,
      description: 'プロダクト開発・技術運営を担当',
      members: getMembersByIds(['dev-001']),
      headMember: getMemberById('dev-001'),
      children: [
        {
          id: 'frontend-team',
          name: 'フロントエンドチーム',
          type: 'team',
          parentId: 'tech-division',
          level: 2,
          memberCount: 7,
          description: 'ユーザーインターフェース開発',
          members: getMembersByIds(['fe-001', 'dev-003', 'fe-002', 'dev-005', 'fe-003', 'fe-004', 'fe-005']),
          headMember: getMemberById('fe-001'),
          children: []
        },
        {
          id: 'backend-team',
          name: 'バックエンドチーム',
          type: 'team',
          parentId: 'tech-division',
          level: 2,
          memberCount: 6,
          description: 'サーバーサイド・API開発',
          members: getMembersByIds(['be-001', 'dev-004', 'be-002', 'be-003', 'be-004', 'be-005']),
          headMember: getMemberById('be-001'),
          children: []
        },
        {
          id: 'dev-general',
          name: '開発共通',
          type: 'department',
          parentId: 'tech-division',
          level: 2,
          memberCount: 9,
          description: 'アーキテクチャ・品質管理',
          members: getMembersByIds(['dev-002', 'dev-006', 'dev-007', 'dev-008', 'dev-009', 'dev-010', 'dev-011', 'dev-012', 'dev-013']),
          headMember: getMemberById('dev-002'),
          children: []
        }
      ]
    },
    {
      id: 'business-division',
      name: 'ビジネス部門',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 19,
      description: '営業・マーケティング活動を担当',
      members: [],
      headMember: undefined,
      children: [
        {
          id: 'sales-dept',
          name: '営業部',
          type: 'department',
          parentId: 'business-division',
          level: 2,
          memberCount: 11,
          description: '新規開拓・既存顧客管理',
          members: getMembersByIds(['sales-001', 'sales-002', 'sales-003', 'sales-004', 'sales-005', 'sales-006', 'sales-007', 'sales-008', 'sales-009', 'sales-010', 'sales-011']),
          headMember: getMemberById('sales-001'),
          children: []
        },
        {
          id: 'marketing-dept',
          name: 'マーケティング部',
          type: 'department',
          parentId: 'business-division',
          level: 2,
          memberCount: 8,
          description: 'ブランディング・プロモーション',
          members: getMembersByIds(['marketing-001', 'marketing-002', 'marketing-003', 'marketing-004', 'marketing-005', 'marketing-006', 'marketing-007', 'marketing-008']),
          headMember: getMemberById('marketing-001'),
          children: []
        }
      ]
    }
  ]
};

// 権限定義
export const permissionDefinitions = {
  attendance: {
    id: 'attendance',
    name: '勤怠管理',
    permissions: [
      {
        id: 'attendance.view_own',
        code: 'attendance.view_own',
        name: '自分の勤怠確認',
        description: '自分の勤怠記録を確認できます',
        level: 'self' as const
      },
      {
        id: 'attendance.edit_own',
        code: 'attendance.edit_own',
        name: '自分の勤怠編集',
        description: '自分の勤怠記録を編集できます',
        level: 'self' as const
      },
      {
        id: 'attendance.view_team',
        code: 'attendance.view_team',
        name: 'チーム勤怠確認',
        description: 'チームメンバーの勤怠記録を確認できます',
        level: 'team' as const
      },
      {
        id: 'attendance.approve_team',
        code: 'attendance.approve_team',
        name: 'チーム勤怠承認',
        description: 'チームメンバーの勤怠を承認できます',
        level: 'team' as const
      },
      {
        id: 'attendance.view_all',
        code: 'attendance.view_all',
        name: '全社勤怠確認',
        description: '全社員の勤怠記録を確認できます',
        level: 'company' as const
      },
      {
        id: 'attendance.manage_all',
        code: 'attendance.manage_all',
        name: '勤怠管理全権',
        description: '全社員の勤怠を管理できます',
        level: 'system' as const
      }
    ]
  },
  leave: {
    id: 'leave',
    name: '休暇管理',
    permissions: [
      {
        id: 'leave.request',
        code: 'leave.request',
        name: '休暇申請',
        description: '休暇申請を作成できます',
        level: 'self' as const
      },
      {
        id: 'leave.view_own',
        code: 'leave.view_own',
        name: '自分の休暇確認',
        description: '自分の休暇記録を確認できます',
        level: 'self' as const
      },
      {
        id: 'leave.approve_team',
        code: 'leave.approve_team',
        name: 'チーム休暇承認',
        description: 'チームメンバーの休暇申請を承認できます',
        level: 'team' as const
      },
      {
        id: 'leave.view_team',
        code: 'leave.view_team',
        name: 'チーム休暇確認',
        description: 'チームメンバーの休暇記録を確認できます',
        level: 'team' as const
      },
      {
        id: 'leave.view_all',
        code: 'leave.view_all',
        name: '全社休暇確認',
        description: '全社員の休暇記録を確認できます',
        level: 'company' as const
      },
      {
        id: 'leave.manage_all',
        code: 'leave.manage_all',
        name: '休暇管理全権',
        description: '全社員の休暇を管理できます',
        level: 'system' as const
      }
    ]
  },
  organization: {
    id: 'organization',
    name: '組織管理',
    permissions: [
      {
        id: 'organization.view',
        code: 'organization.view',
        name: '組織図確認',
        description: '組織図を確認できます',
        level: 'self' as const
      },
      {
        id: 'organization.manage_team',
        code: 'organization.manage_team',
        name: 'チーム管理',
        description: 'チーム情報を管理できます',
        level: 'team' as const
      },
      {
        id: 'organization.manage_all',
        code: 'organization.manage_all',
        name: '組織管理全権',
        description: '全組織構造を管理できます',
        level: 'system' as const
      }
    ]
  },
  system: {
    id: 'system',
    name: 'システム管理',
    permissions: [
      {
        id: 'system.settings',
        code: 'system.settings',
        name: 'システム設定',
        description: 'システム設定を変更できます',
        level: 'system' as const
      },
      {
        id: 'system.user_management',
        code: 'system.user_management',
        name: 'ユーザー管理',
        description: 'ユーザーアカウントを管理できます',
        level: 'system' as const
      },
      {
        id: 'system.audit',
        code: 'system.audit',
        name: '監査ログ',
        description: '監査ログを確認できます',
        level: 'system' as const
      }
    ]
  }
};

// ロール定義
export const roleDefinitions = [
  {
    id: 'employee-role',
    code: 'employee',
    name: '一般社員',
    description: '基本的な機能を利用できます',
    permissions: [
      'attendance.view_own',
      'attendance.edit_own',
      'leave.request',
      'leave.view_own',
      'organization.view'
    ],
    isSystemRole: true
  },
  {
    id: 'manager-role',
    code: 'manager',
    name: 'マネージャー',
    description: 'チーム管理機能を利用できます',
    permissions: [
      'attendance.view_own',
      'attendance.edit_own',
      'attendance.view_team',
      'attendance.approve_team',
      'leave.request',
      'leave.view_own',
      'leave.view_team',
      'leave.approve_team',
      'organization.view',
      'organization.manage_team'
    ],
    isSystemRole: true
  },
  {
    id: 'hr-role',
    code: 'hr',
    name: '人事',
    description: '人事関連機能を管理できます',
    permissions: [
      'attendance.view_own',
      'attendance.edit_own',
      'attendance.view_all',
      'leave.request',
      'leave.view_own',
      'leave.view_all',
      'leave.manage_all',
      'organization.view',
      'organization.manage_all',
      'system.user_management'
    ],
    isSystemRole: true
  },
  {
    id: 'admin-role',
    code: 'admin',
    name: 'システム管理者',
    description: 'すべての機能を管理できます',
    permissions: [
      'attendance.view_own',
      'attendance.edit_own',
      'attendance.view_team',
      'attendance.approve_team',
      'attendance.view_all',
      'attendance.manage_all',
      'leave.request',
      'leave.view_own',
      'leave.view_team',
      'leave.approve_team',
      'leave.view_all',
      'leave.manage_all',
      'organization.view',
      'organization.manage_team',
      'organization.manage_all',
      'system.settings',
      'system.user_management',
      'system.audit'
    ],
    isSystemRole: true
  }
];

// 異動履歴データ
export const demoTransferHistories: TransferHistory[] = [
  // 2024年の異動
  {
    id: 'transfer-001',
    userId: 'fe-005',
    userName: '上田拓也',
    type: 'promotion',
    fromUnitId: 'frontend-team',
    fromUnitName: 'フロントエンドチーム',
    toUnitId: 'frontend-team',
    toUnitName: 'フロントエンドチーム',
    fromPosition: 'フロントエンド開発者',
    toPosition: 'シニアフロントエンド開発者',
    effectiveDate: '2024-10-01',
    reason: '優れた技術力と後輩指導の実績を評価',
    approvedBy: 'cto-001',
    approvedByName: '田中花子',
    createdAt: '2024-09-15T10:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-002',
    userId: 'sales-011',
    userName: '本田雅彦',
    type: 'transfer',
    fromUnitId: 'marketing-dept',
    fromUnitName: 'マーケティング部',
    toUnitId: 'sales-dept',
    toUnitName: '営業部',
    fromPosition: 'マーケティング担当',
    toPosition: '営業担当',
    effectiveDate: '2024-09-01',
    reason: 'マーケティング知見を活かした営業強化のため',
    approvedBy: 'ceo-001',
    approvedByName: '鈴木太郎',
    createdAt: '2024-08-20T14:30:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-003',
    userId: 'be-005',
    userName: '内田千鶴',
    type: 'promotion',
    fromUnitId: 'backend-team',
    fromUnitName: 'バックエンドチーム',
    toUnitId: 'backend-team',
    toUnitName: 'バックエンドチーム',
    fromPosition: 'バックエンド開発者',
    toPosition: 'リードバックエンド開発者',
    effectiveDate: '2024-08-01',
    reason: 'アーキテクチャ設計の主導と高い成果を評価',
    approvedBy: 'cto-001',
    approvedByName: '田中花子',
    createdAt: '2024-07-15T09:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-004',
    userId: 'marketing-008',
    userName: '片岡大輔',
    type: 'role_change',
    fromUnitId: 'marketing-dept',
    fromUnitName: 'マーケティング部',
    toUnitId: 'marketing-dept',
    toUnitName: 'マーケティング部',
    fromPosition: 'マーケティング担当',
    toPosition: 'デジタルマーケティング担当',
    fromRole: 'employee',
    toRole: 'employee',
    effectiveDate: '2024-07-01',
    reason: 'デジタルマーケティング領域の専門性強化',
    approvedBy: 'marketing-001',
    approvedByName: '原田智美',
    createdAt: '2024-06-20T11:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-005',
    userId: 'dev-011',
    userName: '今井俊介',
    type: 'transfer',
    fromUnitId: 'dev-general',
    fromUnitName: '開発共通',
    toUnitId: 'frontend-team',
    toUnitName: 'フロントエンドチーム',
    fromPosition: 'エンジニア',
    toPosition: 'フロントエンド開発者',
    effectiveDate: '2024-06-01',
    reason: 'フロントエンド開発への適性と希望を考慮',
    approvedBy: 'dev-001',
    approvedByName: '伊藤大輔',
    createdAt: '2024-05-15T13:30:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-006',
    userId: 'sales-010',
    userName: '藤井瞳',
    type: 'promotion',
    fromUnitId: 'sales-dept',
    fromUnitName: '営業部',
    toUnitId: 'sales-dept',
    toUnitName: '営業部',
    fromPosition: '営業担当',
    toPosition: 'シニア営業担当',
    effectiveDate: '2024-05-01',
    reason: '高い営業成績と顧客満足度を評価',
    approvedBy: 'sales-001',
    approvedByName: '森田浩司',
    createdAt: '2024-04-20T10:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  // 2024年前半の異動
  {
    id: 'transfer-007',
    userId: 'hr-006',
    userName: '安藤理恵',
    type: 'role_change',
    fromUnitId: 'hr-division',
    fromUnitName: '人事部',
    toUnitId: 'hr-division',
    toUnitName: '人事部',
    fromPosition: '人事担当',
    toPosition: '採用担当',
    effectiveDate: '2024-04-01',
    reason: '採用業務の専門性強化',
    approvedBy: 'hr-001',
    approvedByName: '山田次郎',
    createdAt: '2024-03-15T09:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-008',
    userId: 'dev-012',
    userName: '杉本直子',
    type: 'transfer',
    fromUnitId: 'dev-general',
    fromUnitName: '開発共通',
    toUnitId: 'backend-team',
    toUnitName: 'バックエンドチーム',
    fromPosition: 'エンジニア',
    toPosition: 'バックエンド開発者',
    effectiveDate: '2024-03-01',
    reason: 'バックエンド開発への適性と希望を考慮',
    approvedBy: 'dev-001',
    approvedByName: '伊藤大輔',
    createdAt: '2024-02-15T14:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-009',
    userId: 'marketing-007',
    userName: '河合あゆみ',
    type: 'role_change',
    fromUnitId: 'marketing-dept',
    fromUnitName: 'マーケティング部',
    toUnitId: 'marketing-dept',
    toUnitName: 'マーケティング部',
    fromPosition: 'マーケティング担当',
    toPosition: 'コンテンツマーケティング担当',
    effectiveDate: '2024-02-01',
    reason: 'コンテンツ制作のスキルを活かすため',
    approvedBy: 'marketing-001',
    approvedByName: '原田智美',
    createdAt: '2024-01-20T11:30:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-010',
    userId: 'fe-004',
    userName: '西村香織',
    type: 'promotion',
    fromUnitId: 'frontend-team',
    fromUnitName: 'フロントエンドチーム',
    toUnitId: 'frontend-team',
    toUnitName: 'フロントエンドチーム',
    fromPosition: 'フロントエンド開発者',
    toPosition: 'シニアフロントエンド開発者',
    effectiveDate: '2024-01-01',
    reason: 'React技術力とUI/UX設計能力を評価',
    approvedBy: 'fe-001',
    approvedByName: '松本和也',
    createdAt: '2023-12-15T10:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  // 2023年の異動
  {
    id: 'transfer-011',
    userId: 'sales-009',
    userName: '長野浩',
    type: 'transfer',
    fromUnitId: 'marketing-dept',
    fromUnitName: 'マーケティング部',
    toUnitId: 'sales-dept',
    toUnitName: '営業部',
    fromPosition: 'マーケティング担当',
    toPosition: '営業担当',
    effectiveDate: '2023-11-01',
    reason: 'マーケティング経験を活かした営業活動強化',
    approvedBy: 'ceo-001',
    approvedByName: '鈴木太郎',
    createdAt: '2023-10-20T13:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-012',
    userId: 'be-004',
    userName: '三浦健太郎',
    type: 'promotion',
    fromUnitId: 'backend-team',
    fromUnitName: 'バックエンドチーム',
    toUnitId: 'backend-team',
    toUnitName: 'バックエンドチーム',
    fromPosition: 'バックエンド開発者',
    toPosition: 'シニアバックエンド開発者',
    effectiveDate: '2023-10-01',
    reason: 'API設計とデータベース最適化の功績を評価',
    approvedBy: 'be-001',
    approvedByName: '木村信夫',
    createdAt: '2023-09-15T09:30:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-013',
    userId: 'marketing-006',
    userName: '柴田浩司',
    type: 'promotion',
    fromUnitId: 'marketing-dept',
    fromUnitName: 'マーケティング部',
    toUnitId: 'marketing-dept',
    toUnitName: 'マーケティング部',
    fromPosition: 'デジタルマーケティング担当',
    toPosition: 'マーケティングマネージャー',
    fromRole: 'employee',
    toRole: 'manager',
    effectiveDate: '2023-09-01',
    reason: 'マーケティング戦略の立案とチームリーダーシップを評価',
    approvedBy: 'marketing-001',
    approvedByName: '原田智美',
    createdAt: '2023-08-20T11:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-014',
    userId: 'dev-013',
    userName: '横山勇',
    type: 'transfer',
    fromUnitId: 'backend-team',
    fromUnitName: 'バックエンドチーム',
    toUnitId: 'dev-general',
    toUnitName: '開発共通',
    fromPosition: 'バックエンド開発者',
    toPosition: 'エンジニア',
    effectiveDate: '2023-07-01',
    reason: 'フルスタック開発への適性を考慮',
    approvedBy: 'dev-001',
    approvedByName: '伊藤大輔',
    createdAt: '2023-06-15T14:30:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  },
  {
    id: 'transfer-015',
    userId: 'sales-008',
    userName: '近藤誠',
    type: 'role_change',
    fromUnitId: 'sales-dept',
    fromUnitName: '営業部',
    toUnitId: 'sales-dept',
    toUnitName: '営業部',
    fromPosition: '営業担当',
    toPosition: '法人営業担当',
    effectiveDate: '2023-06-01',
    reason: '法人顧客向け営業の専門性強化',
    approvedBy: 'sales-001',
    approvedByName: '森田浩司',
    createdAt: '2023-05-20T10:00:00Z',
    createdBy: 'hr-001',
    createdByName: '山田次郎'
  }
];