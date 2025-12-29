import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://dandori_admin:DandoriAdmin2025Secure@dandori-portal-db.chya4uuiiy9m.ap-northeast-1.rds.amazonaws.com:5432/dandori_portal?schema=public'
    }
  }
});

// 権限マッピング: 1=employee, 2=manager, 3=executive, 4=hr, 5=admin
const roleMapping: Record<number, string> = {
  1: 'employee',
  2: 'manager',
  3: 'executive',
  4: 'hr',
  5: 'admin',
};

// ダンドリワーク社のテナントID
const DANDORI_WORK_TENANT_ID = 'tenant-006';

// 共通パスワード（初期パスワード）
const DEFAULT_PASSWORD = 'DandoriWork2025!';

// 社員データ
const employees = [
  // 正社員
  { empNo: '1', name: '加賀爪宏介', email: 'kagatsume@dandori-work.com', role: 3, department: '経営企画', position: '代表取締役' },
  { empNo: '3', name: '小坂井優', email: 'kozakai@dandori-work.com', role: 3, department: '経営企画', position: '取締役' },
  { empNo: '101', name: '浦谷孝輔', email: 'uratani@dandori-work.com', role: 2, department: '営業部', position: 'マネージャー' },
  { empNo: '102', name: '杉田清隆', email: 'sugita@dandori-work.com', role: 3, department: '経営企画', position: '取締役' },
  { empNo: '104', name: '伊丹直子', email: 'takada.naoko@dandori-work.com', role: 2, department: '営業部', position: 'マネージャー' },
  { empNo: '105', name: '潟田良太', email: 'katada.ryota@dandori-work.com', role: 2, department: '営業部', position: 'マネージャー' },
  { empNo: '106', name: '佐藤千尋', email: 'sato.chihiro@dandori-work.com', role: 2, department: 'カスタマーサポート', position: 'マネージャー' },
  { empNo: '109', name: '山本啓司', email: 'yamamoto.keiji@dandori-work.com', role: 2, department: '開発部', position: 'マネージャー' },
  { empNo: '110', name: '河野祐輝', email: 'kawano.yuuki@dandori-work.com', role: 1, department: '開発部', position: 'エンジニア' },
  { empNo: '112', name: '北原裕太', email: 'kitahara.yuta@dandori-work.com', role: 2, department: '営業部', position: 'マネージャー' },
  { empNo: '114', name: '濱口将太', email: 'hamaguchi.shota@dandori-work.com', role: 2, department: '営業部', position: 'マネージャー' },
  { empNo: '120', name: '岡本光代', email: 'okamoto.mitsuyo@dandori-work.com', role: 1, department: 'カスタマーサポート', position: 'スタッフ' },
  { empNo: '123', name: '林崇', email: 'hayashi.takashi@dandori-work.com', role: 2, department: '営業部', position: 'マネージャー' },
  { empNo: '125', name: '田邉明瑠', email: 'takashima.akaru@dandori-work.com', role: 1, department: '営業部', position: 'スタッフ' },
  { empNo: '129', name: '静野雅也', email: 'shizuno.masaya@dandori-work.com', role: 5, department: '管理部', position: 'システム管理者' },
  { empNo: '136', name: '岡本優', email: 'okamoto.yu@dandori-work.com', role: 1, department: '営業部', position: 'スタッフ' },
  { empNo: '138', name: '永山智栄美', email: 'nagayama.chiemi@dandori-work.com', role: 1, department: 'カスタマーサポート', position: 'スタッフ' },
  { empNo: '141', name: '川崎理沙', email: 'kawasaki.risa@dandori-work.com', role: 1, department: '営業部', position: 'スタッフ' },
  { empNo: '143', name: '山本敏', email: 'yamamoto.satoshi@dandori-work.com', role: 1, department: '開発部', position: 'エンジニア' },
  { empNo: '144', name: '小出純', email: 'koide.jun@dandori-work.com', role: 1, department: '開発部', position: 'エンジニア' },
  { empNo: '145', name: '小森健太', email: 'komori.kenta@dandori-work.com', role: 1, department: '開発部', position: 'エンジニア' },
  { empNo: '146', name: '西岡優花', email: 'nishioka.yuka@dandori-work.com', role: 1, department: '営業部', position: 'スタッフ' },
  { empNo: '1003', name: '髙倉純子', email: 'takakura.junko@dandori-work.com', role: 4, department: '管理部', position: '人事担当' },
  { empNo: '1006', name: '小林梓', email: 'kobayashi.azusa@dandori-work.com', role: 1, department: 'カスタマーサポート', position: 'スタッフ' },
  // 外注メンバー（グレー）
  { empNo: 'EXT-001', name: '井上康', email: 'inoue@dandori-work.com', role: 1, department: '外部', position: '外部スタッフ' },
  { empNo: 'EXT-002', name: '山岸いづみ', email: 'yamagishi.izumi@dandori-work.com', role: 1, department: '外部', position: '外部スタッフ' },
  { empNo: 'EXT-003', name: '古藤友美', email: 'koto.tomomi@dandori-work.com', role: 1, department: '外部', position: '外部スタッフ' },
  { empNo: 'EXT-004', name: '西平あゆみ', email: 'nishihira.ayumi@dandori-work.com', role: 5, department: '管理部', position: 'システム管理者' },
];

async function main() {
  console.log('ダンドリワーク社員登録を開始します...');
  console.log(`対象: ${employees.length}名`);
  console.log('---');

  // 共通パスワードのハッシュを生成
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  console.log('パスワードハッシュ生成完了');

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const emp of employees) {
    try {
      // 既存ユーザーチェック
      const existing = await prisma.users.findFirst({
        where: { email: emp.email }
      });

      if (existing) {
        // 更新
        await prisma.users.update({
          where: { id: existing.id },
          data: {
            name: emp.name,
            role: roleMapping[emp.role],
            department: emp.department,
            position: emp.position,
            tenantId: DANDORI_WORK_TENANT_ID,
          }
        });
        console.log(`[更新] ${emp.name} (${emp.email}) - ${roleMapping[emp.role]}`);
        updated++;
      } else {
        // 新規作成
        await prisma.users.create({
          data: {
            email: emp.email,
            name: emp.name,
            passwordHash: passwordHash,
            role: roleMapping[emp.role],
            department: emp.department,
            position: emp.position,
            tenantId: DANDORI_WORK_TENANT_ID,
            status: 'active',
          }
        });
        console.log(`[新規] ${emp.name} (${emp.email}) - ${roleMapping[emp.role]}`);
        created++;
      }
    } catch (error) {
      console.error(`[失敗] ${emp.name} (${emp.email}):`, error);
      failed++;
    }
  }

  console.log('---');
  console.log(`完了: 新規${created}名, 更新${updated}名, 失敗${failed}名`);
  console.log(`初期パスワード: ${DEFAULT_PASSWORD}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});
