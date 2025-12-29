import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const demoLegalUpdates = [
  // 2024年 適用済み
  {
    title: '定額減税制度の開始',
    category: 'tax',
    effectiveDate: new Date('2024-06-01'),
    priority: 'high',
    description: '令和6年分所得税・個人住民税の定額減税が実施されました。所得税3万円、個人住民税1万円（本人・配偶者・扶養親族1人につき）の減税が適用されます。',
    affectedAreas: ['給与計算', '年末調整', '源泉徴収'],
    relatedLaws: '所得税法等の一部を改正する法律',
    referenceUrl: 'https://www.nta.go.jp/users/gensen/teigakugenzei/index.htm',
    isPublished: true,
    publishedAt: new Date('2024-05-01'),
    createdBy: 'システム管理者',
  },
  {
    title: '社会保険料率の改定（令和6年度）',
    category: 'social_insurance',
    effectiveDate: new Date('2024-03-01'),
    priority: 'high',
    description: '令和6年度の健康保険料率・介護保険料率が改定されました。協会けんぽの健康保険料率は都道府県ごとに異なります。',
    affectedAreas: ['給与計算', '社会保険手続き'],
    relatedLaws: '健康保険法',
    referenceUrl: 'https://www.kyoukaikenpo.or.jp/g7/cat330/sb3130/r06/r6ryougakuhyou/',
    isPublished: true,
    publishedAt: new Date('2024-02-15'),
    createdBy: 'システム管理者',
  },
  {
    title: '障害者法定雇用率の引き上げ（2.5%）',
    category: 'labor',
    effectiveDate: new Date('2024-04-01'),
    priority: 'high',
    description: '民間企業の障害者法定雇用率が2.3%から2.5%に引き上げられました。従業員40人以上の企業が対象です。',
    affectedAreas: ['人事管理', '雇用管理'],
    relatedLaws: '障害者の雇用の促進等に関する法律',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/shougaishakoyou/index.html',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    createdBy: 'システム管理者',
  },
  {
    title: '労働条件明示ルールの強化',
    category: 'labor',
    effectiveDate: new Date('2024-04-01'),
    priority: 'high',
    description: '労働契約締結時・有期労働契約更新時の労働条件明示事項が追加されました。就業場所・業務の変更範囲、更新上限の明示が義務化されました。',
    affectedAreas: ['労働契約管理', '雇用契約書'],
    relatedLaws: '労働基準法施行規則',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000099951.html',
    isPublished: true,
    publishedAt: new Date('2024-03-15'),
    createdBy: 'システム管理者',
  },

  // 2024年 予定
  {
    title: '障害者法定雇用率のさらなる引き上げ（2.7%）',
    category: 'labor',
    effectiveDate: new Date('2026-07-01'),
    priority: 'high',
    description: '民間企業の障害者法定雇用率が2.7%に段階的に引き上げられます。',
    affectedAreas: ['人事管理', '雇用管理'],
    relatedLaws: '障害者の雇用の促進等に関する法律',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/shougaishakoyou/index.html',
    isPublished: true,
    publishedAt: new Date('2024-04-01'),
    createdBy: 'システム管理者',
  },

  // 2025年 予定
  {
    title: '雇用保険料率の改定（令和7年度）',
    category: 'social_insurance',
    effectiveDate: new Date('2025-04-01'),
    priority: 'medium',
    description: '令和7年度の雇用保険料率改定が予定されています。詳細は令和7年2月頃に発表予定です。',
    affectedAreas: ['給与計算', '雇用保険手続き'],
    relatedLaws: '雇用保険法',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000108634.html',
    isPublished: true,
    publishedAt: new Date('2024-10-01'),
    createdBy: 'システム管理者',
  },
  {
    title: '年収の壁・支援強化パッケージの継続',
    category: 'social_insurance',
    effectiveDate: new Date('2025-10-01'),
    priority: 'medium',
    description: '年収106万円・130万円の壁への対応として、社会保険適用促進手当の標準報酬算定除外措置が継続されます。',
    affectedAreas: ['給与計算', '社会保険手続き'],
    relatedLaws: '健康保険法・厚生年金保険法',
    referenceUrl: 'https://www.mhlw.go.jp/stf/taiou_001_00002.html',
    isPublished: true,
    publishedAt: new Date('2024-09-01'),
    createdBy: 'システム管理者',
  },

  // 年末調整関連
  {
    title: '令和6年分 年末調整の変更点',
    category: 'tax',
    effectiveDate: new Date('2024-12-01'),
    priority: 'high',
    description: '令和6年分の年末調整では、定額減税の精算を含む調整が必要です。また、扶養控除等申告書の様式が一部変更されています。',
    affectedAreas: ['年末調整', '給与計算', '源泉徴収'],
    relatedLaws: '所得税法',
    referenceUrl: 'https://www.nta.go.jp/users/gensen/nencho/index.htm',
    isPublished: true,
    publishedAt: new Date('2024-10-15'),
    createdBy: 'システム管理者',
  },

  // 労働時間関連
  {
    title: '時間外労働の上限規制（建設業・自動車運転業等）',
    category: 'attendance',
    effectiveDate: new Date('2024-04-01'),
    priority: 'high',
    description: '建設業、自動車運転業、医師等にも時間外労働の上限規制が適用開始されました。原則月45時間・年360時間、特別条項でも年720時間以内等の制限があります。',
    affectedAreas: ['勤怠管理', '労働時間管理', '36協定'],
    relatedLaws: '労働基準法',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/gyosyu/shokatsu/index.html',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    createdBy: 'システム管理者',
  },
  {
    title: '月60時間超の時間外労働割増率引き上げ',
    category: 'payroll',
    effectiveDate: new Date('2023-04-01'),
    priority: 'high',
    description: '中小企業における月60時間超の時間外労働の割増賃金率が25%から50%に引き上げられました。',
    affectedAreas: ['給与計算', '勤怠管理'],
    relatedLaws: '労働基準法',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/roudouzikan/index.html',
    isPublished: true,
    publishedAt: new Date('2023-03-01'),
    createdBy: 'システム管理者',
  },

  // その他
  {
    title: 'デジタル給与払いの解禁',
    category: 'payroll',
    effectiveDate: new Date('2023-04-01'),
    priority: 'medium',
    description: '労働者の同意を得た場合、指定資金移動業者の口座への賃金支払いが可能になりました。',
    affectedAreas: ['給与計算', '給与支払い'],
    relatedLaws: '労働基準法施行規則',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html',
    isPublished: true,
    publishedAt: new Date('2023-03-15'),
    createdBy: 'システム管理者',
  },
  {
    title: '育児休業取得状況の公表義務化',
    category: 'labor',
    effectiveDate: new Date('2023-04-01'),
    priority: 'medium',
    description: '従業員数1,000人超の企業に対して、育児休業取得状況の年1回の公表が義務付けられました。',
    affectedAreas: ['人事管理', '労務管理'],
    relatedLaws: '育児・介護休業法',
    referenceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000130583.html',
    isPublished: true,
    publishedAt: new Date('2023-03-01'),
    createdBy: 'システム管理者',
  },
];

async function main() {
  console.log('法令更新デモデータの投入を開始します...');

  // 既存データを削除（オプション）
  const existingCount = await prisma.legal_updates.count();
  if (existingCount > 0) {
    console.log(`既存データ ${existingCount} 件をスキップします`);
  }

  // データを投入
  let created = 0;
  for (const data of demoLegalUpdates) {
    try {
      // 同じタイトルが既に存在するかチェック
      const existing = await prisma.legal_updates.findFirst({
        where: { title: data.title },
      });

      if (existing) {
        console.log(`スキップ: ${data.title}（既に存在）`);
        continue;
      }

      await prisma.legal_updates.create({
        data,
      });
      console.log(`作成: ${data.title}`);
      created++;
    } catch (error) {
      console.error(`エラー: ${data.title}`, error);
    }
  }

  console.log(`\n完了: ${created} 件の法令更新データを追加しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
