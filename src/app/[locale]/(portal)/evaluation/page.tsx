'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Target,
  Users,
  TrendingUp,
  CheckCircle,
  Calendar,
  Award,
  MessageSquare,
  Settings,
  Sparkles,
  Mail,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EvaluationPage() {
  const [notifyMe, setNotifyMe] = useState(false);

  const handleNotifyClick = () => {
    setNotifyMe(true);
    toast.success('リリース通知を登録しました', {
      description: '人事評価機能の公開時にお知らせします',
    });
  };

  const features = [
    {
      icon: Target,
      title: 'MBO（目標管理）',
      description: '個人目標の設定・進捗管理・達成度評価を一元管理',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: TrendingUp,
      title: 'OKR',
      description: '四半期ごとのObjective & Key Resultsでアジャイルな目標管理',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Users,
      title: '360度評価',
      description: '上司・同僚・部下からの多面的なフィードバック',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: Award,
      title: 'コンピテンシー評価',
      description: '職種・役職別の行動評価基準で客観的に評価',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      icon: CheckCircle,
      title: '承認フロー',
      description: '自己評価→一次評価→二次評価の段階的なプロセス管理',
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      icon: Settings,
      title: '柔軟なカスタマイズ',
      description: '評価項目・フロー・テンプレートを自社に合わせて設定可能',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  const benefits = [
    {
      icon: Calendar,
      title: '評価期間の自動管理',
      description: 'リマインダー・期限管理で評価プロセスをスムーズに',
    },
    {
      icon: TrendingUp,
      title: '給与・賞与への連携',
      description: '評価結果を給与計算に自動反映',
    },
    {
      icon: MessageSquare,
      title: '1on1記録連携',
      description: '日常のフィードバックを評価に活用',
    },
    {
      icon: Star,
      title: '評価分析レポート',
      description: '部署別・評価者別の分析で組織の課題を可視化',
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* ヒーローセクション */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-3xl">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">
            <Sparkles className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            人事評価機能
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-6">
            MBO・OKR・360度評価など、包括的な人事評価システムを近日リリース予定
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleNotifyClick}
              disabled={notifyMe}
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              {notifyMe ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5" />
                  通知登録済み
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-5 w-5" />
                  リリース通知を受け取る
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-white/90"
              onClick={() => {
                toast.info('お問い合わせ機能は準備中です', {
                  description: 'リリース時にご案内いたします',
                });
              }}
            >
              <Mail className="mr-2 h-5 w-5" />
              詳細を問い合わせる
            </Button>
          </div>
        </div>

        {/* 装飾 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* 主要機能 */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">主要機能</h2>
          <p className="text-muted-foreground">
            柔軟な評価制度設計で、あらゆる組織の評価プロセスに対応
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* その他のメリット */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">その他のメリット</h2>
          <p className="text-muted-foreground">
            評価業務の効率化と、従業員の成長を支援
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="flex items-start gap-4 p-6">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* リリーススケジュール */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            リリーススケジュール
          </CardTitle>
          <CardDescription>
            段階的に機能をリリース予定です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0">
                <Badge variant="outline">Phase 1</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">目標管理（MBO）</h4>
                <p className="text-sm text-muted-foreground">
                  目標設定・進捗管理・達成度評価の基本機能
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0">
                <Badge variant="outline">Phase 2</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">コンピテンシー評価</h4>
                <p className="text-sm text-muted-foreground">
                  職種別の行動評価と自己評価機能
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0">
                <Badge variant="outline">Phase 3</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">承認フロー・360度評価</h4>
                <p className="text-sm text-muted-foreground">
                  段階的な評価プロセスと多面評価機能
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0">
                <Badge variant="outline">Phase 4</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">評価制度カスタマイズ</h4>
                <p className="text-sm text-muted-foreground">
                  テンプレート管理・柔軟な制度設計機能
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2">
        <CardContent className="p-8 text-center">
          <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">リリースをお楽しみに</h3>
          <p className="text-muted-foreground mb-6">
            人事評価機能は、テナントごとにON/OFF可能なオプション機能としてリリース予定です。
            <br />
            詳細は追ってご案内いたします。
          </p>
          {!notifyMe && (
            <Button size="lg" onClick={handleNotifyClick}>
              <Bell className="mr-2 h-5 w-5" />
              リリース通知を受け取る
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
