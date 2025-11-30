'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Clock, Info } from 'lucide-react';

// 厚労省標準57問版ストレスチェック質問
// A群: 仕事のストレス要因に関する質問（17問）
// B群: ストレスによる心身の反応（29問）
// C群: 周囲のサポート（11問）

type QuestionCategory = 'A' | 'B' | 'C';

interface Question {
  id: number;
  category: QuestionCategory;
  text: string;
  reverseScore?: boolean; // 逆転項目
}

const QUESTIONS: Question[] = [
  // A群: 仕事のストレス要因（17問）
  { id: 1, category: 'A', text: '非常にたくさんの仕事をしなければならない' },
  { id: 2, category: 'A', text: '時間内に仕事が処理しきれない' },
  { id: 3, category: 'A', text: '一生懸命働かなければならない' },
  { id: 4, category: 'A', text: 'かなり注意を集中する必要がある' },
  { id: 5, category: 'A', text: '高度の知識や技術が必要なむずかしい仕事だ' },
  { id: 6, category: 'A', text: '勤務時間中はいつも仕事のことを考えていなければならない' },
  { id: 7, category: 'A', text: 'からだを大変よく使う仕事だ' },
  { id: 8, category: 'A', text: '自分のペースで仕事ができる', reverseScore: true },
  { id: 9, category: 'A', text: '自分で仕事の順番・やり方を決めることができる', reverseScore: true },
  { id: 10, category: 'A', text: '職場の仕事の方針に自分の意見を反映できる', reverseScore: true },
  { id: 11, category: 'A', text: '自分の技能や知識を仕事で使うことが少ない' },
  { id: 12, category: 'A', text: '私の部署内で意見の食い違いがある' },
  { id: 13, category: 'A', text: '私の部署と他の部署とはうまが合わない' },
  { id: 14, category: 'A', text: '私の職場の雰囲気は友好的である', reverseScore: true },
  { id: 15, category: 'A', text: '私の職場の作業環境（騒音、照明、温度、換気など）はよくない' },
  { id: 16, category: 'A', text: '仕事の内容は自分にあっている', reverseScore: true },
  { id: 17, category: 'A', text: '働きがいのある仕事だ', reverseScore: true },

  // B群: ストレスによる心身の反応（29問）
  { id: 18, category: 'B', text: '活気がわいてくる', reverseScore: true },
  { id: 19, category: 'B', text: '元気がいっぱいだ', reverseScore: true },
  { id: 20, category: 'B', text: '生き生きする', reverseScore: true },
  { id: 21, category: 'B', text: '怒りを感じる' },
  { id: 22, category: 'B', text: '内心腹立たしい' },
  { id: 23, category: 'B', text: 'イライラしている' },
  { id: 24, category: 'B', text: 'ひどく疲れた' },
  { id: 25, category: 'B', text: 'へとへとだ' },
  { id: 26, category: 'B', text: 'だるい' },
  { id: 27, category: 'B', text: '気がはりつめている' },
  { id: 28, category: 'B', text: '不安だ' },
  { id: 29, category: 'B', text: '落着かない' },
  { id: 30, category: 'B', text: 'ゆううつだ' },
  { id: 31, category: 'B', text: '何をするのも面倒だ' },
  { id: 32, category: 'B', text: '物事に集中できない' },
  { id: 33, category: 'B', text: '気分が晴れない' },
  { id: 34, category: 'B', text: '仕事が手につかない' },
  { id: 35, category: 'B', text: '悲しいと感じる' },
  { id: 36, category: 'B', text: 'めまいがする' },
  { id: 37, category: 'B', text: '体のふしぶしが痛む' },
  { id: 38, category: 'B', text: '頭が重かったり頭痛がする' },
  { id: 39, category: 'B', text: '首筋や肩がこる' },
  { id: 40, category: 'B', text: '腰が痛い' },
  { id: 41, category: 'B', text: '目が疲れる' },
  { id: 42, category: 'B', text: '動悸や息切れがする' },
  { id: 43, category: 'B', text: '胃腸の具合が悪い' },
  { id: 44, category: 'B', text: '食欲がない' },
  { id: 45, category: 'B', text: '便秘や下痢をする' },
  { id: 46, category: 'B', text: 'よく眠れない' },

  // C群: 周囲のサポート（11問）
  { id: 47, category: 'C', text: '上司とはどのくらい気軽に話ができますか', reverseScore: true },
  { id: 48, category: 'C', text: '上司はあなたが困った時、どのくらい頼りになりますか', reverseScore: true },
  { id: 49, category: 'C', text: '上司はあなたの個人的な問題を相談したら、どのくらいきいてくれますか', reverseScore: true },
  { id: 50, category: 'C', text: '職場の同僚とはどのくらい気軽に話ができますか', reverseScore: true },
  { id: 51, category: 'C', text: '職場の同僚はあなたが困った時、どのくらい頼りになりますか', reverseScore: true },
  { id: 52, category: 'C', text: '職場の同僚はあなたの個人的な問題を相談したら、どのくらいきいてくれますか', reverseScore: true },
  { id: 53, category: 'C', text: '配偶者、家族、友人等とはどのくらい気軽に話ができますか', reverseScore: true },
  { id: 54, category: 'C', text: '配偶者、家族、友人等はあなたが困った時、どのくらい頼りになりますか', reverseScore: true },
  { id: 55, category: 'C', text: '配偶者、家族、友人等はあなたの個人的な問題を相談したら、どのくらいきいてくれますか', reverseScore: true },
  { id: 56, category: 'C', text: '仕事や生活の満足度はどのくらいですか', reverseScore: true },
  { id: 57, category: 'C', text: '家庭生活は満足ですか', reverseScore: true },
];

// 回答選択肢（カテゴリによって異なる）
const ANSWER_OPTIONS_AB = [
  { value: '1', label: 'そうだ', score: 4 },
  { value: '2', label: 'まあそうだ', score: 3 },
  { value: '3', label: 'ややちがう', score: 2 },
  { value: '4', label: 'ちがう', score: 1 },
];

const ANSWER_OPTIONS_C = [
  { value: '1', label: '非常に', score: 4 },
  { value: '2', label: 'かなり', score: 3 },
  { value: '3', label: '多少', score: 2 },
  { value: '4', label: '全くない', score: 1 },
];

const CATEGORY_INFO = {
  A: { name: '仕事のストレス要因', description: 'あなたの仕事についてうかがいます。最もあてはまるものを選んでください。', color: 'bg-blue-100 text-blue-800' },
  B: { name: 'ストレスによる心身の反応', description: '最近1ヶ月間のあなたの状態についてうかがいます。', color: 'bg-green-100 text-green-800' },
  C: { name: '周囲のサポート', description: 'あなたの周りの人についてうかがいます。', color: 'bg-purple-100 text-purple-800' },
};

const QUESTIONS_PER_PAGE = 5;

export default function StressCheckTakePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'ja';

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<{
    stressFactorsScore: number;
    stressResponseScore: number;
    socialSupportScore: number;
    isHighStress: boolean;
  } | null>(null);

  const totalPages = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);

  const currentQuestions = useMemo(() => {
    const start = currentPage * QUESTIONS_PER_PAGE;
    return QUESTIONS.slice(start, start + QUESTIONS_PER_PAGE);
  }, [currentPage]);

  const progress = useMemo(() => {
    return (Object.keys(answers).length / QUESTIONS.length) * 100;
  }, [answers]);

  const currentCategory = currentQuestions[0]?.category;

  const canGoNext = useMemo(() => {
    return currentQuestions.every(q => answers[q.id]);
  }, [currentQuestions, answers]);

  const handleAnswer = (questionId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const calculateScore = () => {
    // A群スコア計算（ストレス要因）
    let stressFactorsScore = 0;
    QUESTIONS.filter(q => q.category === 'A').forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        const option = ANSWER_OPTIONS_AB.find(o => o.value === answer);
        if (option) {
          // 逆転項目の場合はスコアを反転
          stressFactorsScore += q.reverseScore ? (5 - option.score) : option.score;
        }
      }
    });

    // B群スコア計算（心身の反応）
    let stressResponseScore = 0;
    QUESTIONS.filter(q => q.category === 'B').forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        const option = ANSWER_OPTIONS_AB.find(o => o.value === answer);
        if (option) {
          stressResponseScore += q.reverseScore ? (5 - option.score) : option.score;
        }
      }
    });

    // C群スコア計算（周囲のサポート）
    let socialSupportScore = 0;
    QUESTIONS.filter(q => q.category === 'C').forEach(q => {
      const answer = answers[q.id];
      if (answer) {
        const option = ANSWER_OPTIONS_C.find(o => o.value === answer);
        if (option) {
          socialSupportScore += q.reverseScore ? (5 - option.score) : option.score;
        }
      }
    });

    // 高ストレス判定（簡易基準）
    // B群が高い(77点以上)、またはA群+C群が高くかつB群も一定以上
    const isHighStress = stressResponseScore >= 77 ||
      (stressFactorsScore >= 57 && socialSupportScore <= 24 && stressResponseScore >= 63);

    return {
      stressFactorsScore,
      stressResponseScore,
      socialSupportScore,
      isHighStress,
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // スコア計算
    const calculatedResult = calculateScore();

    // デモ用に少し遅延
    await new Promise(resolve => setTimeout(resolve, 1000));

    setResult(calculatedResult);
    setShowSubmitDialog(false);
    setShowResult(true);
    setIsSubmitting(false);
  };

  const getAnswerOptions = (category: QuestionCategory) => {
    return category === 'C' ? ANSWER_OPTIONS_C : ANSWER_OPTIONS_AB;
  };

  if (showResult && result) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ストレスチェック結果</h1>
            <p className="text-muted-foreground mt-1">回答が完了しました</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.isHighStress ? (
                <>
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <span className="text-red-500">高ストレス状態の可能性があります</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <span className="text-green-500">現時点では問題ありません</span>
                </>
              )}
            </CardTitle>
            <CardDescription>
              あなたのストレスチェック結果の概要です。詳細な結果は後日、産業医との面談で確認できます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">仕事のストレス要因（A群）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{result.stressFactorsScore}</div>
                  <p className="text-xs text-muted-foreground">17問 × 4点満点 = 68点中</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">心身のストレス反応（B群）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{result.stressResponseScore}</div>
                  <p className="text-xs text-muted-foreground">29問 × 4点満点 = 116点中</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">周囲のサポート（C群）</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{result.socialSupportScore}</div>
                  <p className="text-xs text-muted-foreground">11問 × 4点満点 = 44点中</p>
                </CardContent>
              </Card>
            </div>

            {result.isHighStress && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">産業医との面談をお勧めします</h4>
                    <p className="text-sm text-red-600 mt-1">
                      高ストレス状態の可能性があります。希望される場合は、産業医との面談を申し込むことができます。
                      面談では、ストレスの原因や対処法について相談できます。
                    </p>
                    <Button className="mt-3" variant="destructive" size="sm">
                      面談を申し込む
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">結果の取り扱いについて</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    ストレスチェックの結果は、法令に基づき厳重に管理されます。
                    本人の同意なく、事業者に結果が通知されることはありません。
                    ただし、集団分析の結果は個人が特定されない形で活用される場合があります。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.push(`/${locale}/health`)}>
                健康管理トップに戻る
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ストレスチェック受検</h1>
          <p className="text-muted-foreground mt-1">厚生労働省 職業性ストレス簡易調査票（57項目）</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>所要時間: 約10分</span>
        </Badge>
      </div>

      {/* 進捗バー */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>進捗状況</span>
              <span>{Object.keys(answers).length} / {QUESTIONS.length} 問完了</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ情報 */}
      {currentCategory && (
        <Card className={CATEGORY_INFO[currentCategory].color.replace('bg-', 'border-').replace('-100', '-300')}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Badge className={CATEGORY_INFO[currentCategory].color}>
                {currentCategory}群
              </Badge>
              <CardTitle className="text-lg">{CATEGORY_INFO[currentCategory].name}</CardTitle>
            </div>
            <CardDescription>{CATEGORY_INFO[currentCategory].description}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* 質問 */}
      <Card>
        <CardContent className="pt-6 space-y-8">
          {currentQuestions.map((question, index) => (
            <div key={question.id} className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                  {question.id}
                </span>
                <p className="text-base pt-1">{question.text}</p>
              </div>

              <RadioGroup
                value={answers[question.id] || ''}
                onValueChange={(value) => handleAnswer(question.id, value)}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 pl-11"
              >
                {getAnswerOptions(question.category).map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`q${question.id}-${option.value}`}
                    />
                    <Label
                      htmlFor={`q${question.id}-${option.value}`}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {index < currentQuestions.length - 1 && (
                <hr className="border-border" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ナビゲーション */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentPage === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          前へ
        </Button>

        <span className="text-sm text-muted-foreground">
          {currentPage + 1} / {totalPages} ページ
        </span>

        {currentPage === totalPages - 1 ? (
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={Object.keys(answers).length !== QUESTIONS.length}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            回答を送信
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canGoNext}
          >
            次へ
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* 送信確認ダイアログ */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ストレスチェックを送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              送信後は回答の修正ができません。すべての回答を確認してから送信してください。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '送信中...' : '送信する'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
