import type { OrganizationNode, OrganizationMember, UserRole } from '@/types';

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
      memberCount: 3,
      description: '人事・労務管理全般を担当',
      members: getMembersByIds(['hr-001', 'hr-002', 'hr-003']),
      headMember: getMemberById('hr-001'),
      children: []
    },
    {
      id: 'tech-division',
      name: '技術部門',
      type: 'division',
      parentId: 'company',
      level: 1,
      memberCount: 10,
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
          memberCount: 4,
          description: 'ユーザーインターフェース開発',
          members: getMembersByIds(['fe-001', 'dev-003', 'fe-002', 'dev-005']),
          headMember: getMemberById('fe-001'),
          children: []
        },
        {
          id: 'backend-team',
          name: 'バックエンドチーム',
          type: 'team',
          parentId: 'tech-division',
          level: 2,
          memberCount: 3,
          description: 'サーバーサイド・API開発',
          members: getMembersByIds(['be-001', 'dev-004', 'be-002']),
          headMember: getMemberById('be-001'),
          children: []
        },
        {
          id: 'dev-general',
          name: '開発共通',
          type: 'department',
          parentId: 'tech-division',
          level: 2,
          memberCount: 1,
          description: 'アーキテクチャ・品質管理',
          members: getMembersByIds(['dev-002']),
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
      memberCount: 5,
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
          memberCount: 3,
          description: '新規開拓・既存顧客管理',
          members: getMembersByIds(['sales-001', 'sales-002', 'sales-003']),
          headMember: getMemberById('sales-001'),
          children: []
        },
        {
          id: 'marketing-dept',
          name: 'マーケティング部',
          type: 'department',
          parentId: 'business-division',
          level: 2,
          memberCount: 2,
          description: 'ブランディング・プロモーション',
          members: getMembersByIds(['marketing-001', 'marketing-002']),
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