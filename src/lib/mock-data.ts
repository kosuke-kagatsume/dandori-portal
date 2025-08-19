import { User } from '@/types';

// 日本人の姓名データ
const lastNames = ['佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤', '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '斎藤', '清水'];
const firstNamesMale = ['太郎', '一郎', '健太', '大輔', '翔太', '拓也', '雄太', '健二', '達也', '隆', '誠', '浩', '修', '和也', '直樹'];
const firstNamesFemale = ['花子', '美咲', '愛', 'さくら', '陽子', '真由美', '恵子', '由美', '裕子', '智子', '優子', '明美', '美香', '直美', '理恵'];

// 部署データ
const departments = [
  { id: 'dept-1', name: '経営企画室', divisionId: 'div-1' },
  { id: 'dept-2', name: '第一営業部', divisionId: 'div-2' },
  { id: 'dept-3', name: '第二営業部', divisionId: 'div-2' },
  { id: 'dept-4', name: 'プロダクト開発部', divisionId: 'div-3' },
  { id: 'dept-5', name: 'QA部', divisionId: 'div-3' },
  { id: 'dept-6', name: '人事部', divisionId: 'div-4' },
  { id: 'dept-7', name: '経理部', divisionId: 'div-4' },
  { id: 'dept-8', name: '総務部', divisionId: 'div-4' },
];

// 役職データ
const positions = [
  '代表取締役',
  '専務取締役',
  '常務取締役',
  '本部長',
  '部長',
  '次長',
  '課長',
  '係長',
  '主任',
  'リーダー',
  'シニアエンジニア',
  'エンジニア',
  'ジュニアエンジニア',
  'マネージャー',
  'スペシャリスト',
  'アナリスト',
  'コンサルタント',
  '一般社員',
];

// 資格データ
const certifications = [
  { name: '一級建築士', organization: '国土交通省', hasExpiry: true },
  { name: '二級建築士', organization: '国土交通省', hasExpiry: true },
  { name: '施工管理技士', organization: '国土交通省', hasExpiry: false },
  { name: '建設業経理士1級', organization: '建設業振興基金', hasExpiry: true },
  { name: '宅地建物取引士', organization: '国土交通省', hasExpiry: true },
  { name: 'PMP', organization: 'PMI', hasExpiry: true },
  { name: '情報処理安全確保支援士', organization: 'IPA', hasExpiry: true },
  { name: 'AWS認定ソリューションアーキテクト', organization: 'Amazon', hasExpiry: true },
  { name: 'TOEIC 900+', organization: 'ETS', hasExpiry: false },
  { name: '日商簿記1級', organization: '日本商工会議所', hasExpiry: false },
  { name: '社会保険労務士', organization: '厚生労働省', hasExpiry: true },
  { name: '中小企業診断士', organization: '経済産業省', hasExpiry: true },
];

// スキルデータ
const skills = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 
  'Python', 'Java', 'C#', 'Go', 'Ruby', 'PHP',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
  'Git', 'CI/CD', 'Agile', 'Scrum',
  'プロジェクト管理', '要件定義', '設計', 'テスト',
  'マーケティング', '営業', '経理', '人事',
];

// ランダムな日付を生成
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// ランダムな電話番号を生成
function randomPhone(): string {
  const prefix = ['090', '080', '070'][Math.floor(Math.random() * 3)];
  const middle = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const last = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${middle}-${last}`;
}

// 50人分のユーザーデータを生成
export function generateMockUsers(): User[] {
  const users: User[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const isFemale = Math.random() > 0.6; // 40%女性
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = isFemale 
      ? firstNamesFemale[Math.floor(Math.random() * firstNamesFemale.length)]
      : firstNamesMale[Math.floor(Math.random() * firstNamesMale.length)];
    
    const department = departments[Math.floor(Math.random() * departments.length)];
    const position = positions[Math.min(Math.floor(Math.random() * positions.length), Math.floor((50 - i) / 3))];
    
    // 入社日を生成（1年～20年前）
    const yearsAgo = Math.floor(Math.random() * 20) + 1;
    const hireDate = new Date();
    hireDate.setFullYear(hireDate.getFullYear() - yearsAgo);
    
    const user: User = {
      id: `user-${i}`,
      name: `${lastName} ${firstName}`,
      email: `${lastName.toLowerCase()}.${firstName.toLowerCase()}@dandori.co.jp`.replace(/[ぁ-ん]/g, (s) => String.fromCharCode(s.charCodeAt(0) + 96)),
      phone: randomPhone(),
      hireDate: randomDate(hireDate, hireDate),
      unitId: department.id,
      department: department.name,
      position: position,
      roles: i === 1 ? ['admin', 'user'] : ['user'],
      status: Math.random() > 0.95 ? 'inactive' : 'active',
      timezone: 'Asia/Tokyo',
      avatar: `https://i.pravatar.cc/150?img=${i}`,
    };
    
    users.push(user);
  }
  
  // 最初のユーザーを山田太郎（管理者）に固定
  users[0] = {
    id: 'user-1',
    name: '山田 太郎',
    email: 'yamada.taro@dandori.co.jp',
    phone: '090-1234-5678',
    hireDate: '2015-04-01',
    unitId: 'dept-1',
    department: '経営企画室',
    position: '代表取締役',
    roles: ['admin', 'user'],
    status: 'active',
    timezone: 'Asia/Tokyo',
    avatar: 'https://i.pravatar.cc/150?img=1',
  };
  
  return users;
}

// ユーザーごとの資格データを生成
export function generateUserCertifications(userId: string) {
  const numCerts = Math.floor(Math.random() * 4) + 1; // 1～4個の資格
  const userCerts = [];
  const selectedCerts = new Set<number>();
  
  for (let i = 0; i < numCerts; i++) {
    let certIndex;
    do {
      certIndex = Math.floor(Math.random() * certifications.length);
    } while (selectedCerts.has(certIndex));
    selectedCerts.add(certIndex);
    
    const cert = certifications[certIndex];
    const issueDate = randomDate(new Date(2015, 0, 1), new Date(2023, 11, 31));
    let expiryDate = null;
    let status = 'active';
    
    if (cert.hasExpiry) {
      const expiry = new Date(issueDate);
      expiry.setFullYear(expiry.getFullYear() + (Math.random() > 0.5 ? 3 : 5));
      expiryDate = expiry.toISOString().split('T')[0];
      
      const now = new Date();
      const expiryTime = expiry.getTime();
      const nowTime = now.getTime();
      const threeMonths = 90 * 24 * 60 * 60 * 1000;
      
      if (expiryTime < nowTime) {
        status = 'expired';
      } else if (expiryTime - nowTime < threeMonths) {
        status = 'expiring';
      }
    }
    
    userCerts.push({
      id: `cert-${userId}-${i + 1}`,
      name: cert.name,
      organization: cert.organization,
      issueDate,
      expiryDate,
      status,
      document: `${cert.name.replace(/\s/g, '_')}_${userId}.pdf`,
      fileSize: `${(Math.random() * 2 + 0.5).toFixed(1)}MB`
    });
  }
  
  return userCerts;
}

// ユーザーごとのスキルデータを生成
export function generateUserSkills(userId: string) {
  const numSkills = Math.floor(Math.random() * 7) + 3; // 3～9個のスキル
  const userSkills = [];
  const selectedSkills = new Set<number>();
  
  for (let i = 0; i < numSkills; i++) {
    let skillIndex;
    do {
      skillIndex = Math.floor(Math.random() * skills.length);
    } while (selectedSkills.has(skillIndex));
    selectedSkills.add(skillIndex);
    
    userSkills.push({
      name: skills[skillIndex],
      level: Math.floor(Math.random() * 40) + 60, // 60～100%
      category: skillIndex < 12 ? 'プログラミング' : 
                skillIndex < 17 ? 'インフラ' :
                skillIndex < 21 ? 'データベース' :
                skillIndex < 25 ? '開発手法' : 'ビジネス'
    });
  }
  
  return userSkills;
}

// 勤怠データを生成（50人分）
export function generateAttendanceData() {
  const users = generateMockUsers();
  const today = new Date();
  const attendanceData = [];
  
  for (const user of users) {
    const isPresent = Math.random() > 0.15; // 85%出勤
    const checkIn = isPresent ? `09:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}` : null;
    const checkOut = isPresent && Math.random() > 0.3 ? `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null;
    
    attendanceData.push({
      userId: user.id,
      userName: user.name,
      department: user.department,
      date: today.toISOString().split('T')[0],
      checkIn,
      checkOut,
      status: !isPresent ? '休暇' : checkOut ? '退勤済' : '勤務中',
      workHours: checkIn && checkOut ? 
        `${Math.floor(Math.random() * 3 + 8)}時間${Math.floor(Math.random() * 60)}分` : 
        null
    });
  }
  
  return attendanceData;
}

// 休暇データを生成（50人分の集計）
export function generateLeaveData() {
  const users = generateMockUsers();
  const leaveData = [];
  
  for (const user of users) {
    const totalDays = 20; // 年間有給日数
    const usedDays = Math.floor(Math.random() * 15); // 0～14日使用
    const pendingDays = Math.floor(Math.random() * 3); // 0～2日申請中
    const remainingDays = totalDays - usedDays;
    const expiringDays = Math.random() > 0.7 ? Math.floor(Math.random() * 5) : 0;
    
    leaveData.push({
      userId: user.id,
      userName: user.name,
      department: user.department,
      totalDays,
      usedDays,
      pendingDays,
      remainingDays,
      expiringDays,
      lastUsed: usedDays > 0 ? randomDate(new Date(2024, 0, 1), new Date()) : null
    });
  }
  
  return leaveData;
}

// ダッシュボードの統計データ
export function getDashboardStats() {
  const users = generateMockUsers();
  const attendance = generateAttendanceData();
  
  return {
    totalEmployees: 50,
    todayAttendance: attendance.filter(a => a.status !== '休暇').length,
    pendingApprovals: Math.floor(Math.random() * 10) + 5,
    monthlyUtilization: 87.5,
    activeProjects: 12,
    completedTasks: 234,
    upcomingDeadlines: 8
  };
}