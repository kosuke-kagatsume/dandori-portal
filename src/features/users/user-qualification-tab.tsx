'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Briefcase, Star, Trophy, Edit, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

interface UserQualificationTabProps {
  user: User;
  isReadOnly: boolean; // true = 閲覧のみ（経営者・管理者・一般社員等）
  isHR: boolean; // true = HR（直接編集可能）
}

type EditSection = 'qualification' | 'skill' | 'career' | 'achievement' | null;

const skillLevelLabels: Record<string, string> = {
  beginner: '初級',
  intermediate: '中級',
  advanced: '上級',
  expert: 'エキスパート',
};

const skillLevelColors: Record<string, string> = {
  beginner: 'secondary',
  intermediate: 'outline',
  advanced: 'default',
  expert: 'default',
};

export function UserQualificationTab({ user, isReadOnly, isHR }: UserQualificationTabProps) {
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeRequestNote, setChangeRequestNote] = useState('');

  // 一般社員の変更申請
  const handleChangeRequest = () => {
    if (!changeRequestNote.trim()) {
      toast.error('変更内容を入力してください');
      return;
    }
    // TODO: ワークフロー申請API連携
    toast.success('変更申請を提出しました。人事担当者の承認をお待ちください。');
    setChangeRequestNote('');
    setChangeRequestOpen(false);
  };

  // セクションの編集ボタン表示ロジック
  const renderEditButton = (section: EditSection) => {
    if (isHR) {
      return (
        <Button variant="outline" size="sm" onClick={() => setEditSection(section)}>
          <Edit className="mr-2 h-4 w-4" />
          編集
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* 一般社員向け変更申請ボタン */}
      {!isHR && !isReadOnly && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setChangeRequestOpen(true)}>
            <Send className="mr-2 h-4 w-4" />
            資格情報の変更を申請
          </Button>
        </div>
      )}

      {/* 資格・免許 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">資格・免許</CardTitle>
                <CardDescription>保有資格と免許情報</CardDescription>
              </div>
            </div>
            {renderEditButton('qualification')}
          </div>
        </CardHeader>
        <CardContent>
          {(!user.qualifications || user.qualifications.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">資格・免許情報はありません</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>資格・免許名</TableHead>
                  <TableHead>発行機関</TableHead>
                  <TableHead>取得日</TableHead>
                  <TableHead>有効期限</TableHead>
                  <TableHead>証書番号</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.qualifications.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">{q.name}</TableCell>
                    <TableCell>{q.issuer || '-'}</TableCell>
                    <TableCell>
                      {q.acquiredDate ? new Date(q.acquiredDate).toLocaleDateString('ja-JP') : '-'}
                    </TableCell>
                    <TableCell>
                      {q.expiryDate ? (
                        <span className={new Date(q.expiryDate) < new Date() ? 'text-destructive font-medium' : ''}>
                          {new Date(q.expiryDate).toLocaleDateString('ja-JP')}
                          {new Date(q.expiryDate) < new Date() && ' (期限切れ)'}
                        </span>
                      ) : (
                        '無期限'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.certificateNumber || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* スキル */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">スキル</CardTitle>
                <CardDescription>技能・スキル情報</CardDescription>
              </div>
            </div>
            {renderEditButton('skill')}
          </div>
        </CardHeader>
        <CardContent>
          {(!user.skills || user.skills.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">スキル情報はありません</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill) => (
                <div key={skill.id} className="flex items-center gap-2 rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{skill.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {skill.level && (
                        <Badge variant={skillLevelColors[skill.level] as 'default' | 'secondary' | 'outline'}>
                          {skillLevelLabels[skill.level]}
                        </Badge>
                      )}
                      {skill.yearsOfExperience !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {skill.yearsOfExperience}年
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 職歴 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">職歴</CardTitle>
                <CardDescription>キャリア履歴</CardDescription>
              </div>
            </div>
            {renderEditButton('career')}
          </div>
        </CardHeader>
        <CardContent>
          {(!user.careerHistory || user.careerHistory.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">職歴情報はありません</p>
          ) : (
            <div className="space-y-4">
              {user.careerHistory.map((career) => (
                <div key={career.id} className="border-l-4 border-l-primary/20 pl-4 py-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{career.companyName}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(career.startDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })}
                      {' - '}
                      {career.endDate
                        ? new Date(career.endDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short' })
                        : '現在'}
                    </span>
                  </div>
                  {(career.department || career.position) && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {[career.department, career.position].filter(Boolean).join(' / ')}
                    </p>
                  )}
                  {career.description && (
                    <p className="text-sm mt-1">{career.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 実績 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              <div>
                <CardTitle className="text-base">実績</CardTitle>
                <CardDescription>業務上の実績・成果</CardDescription>
              </div>
            </div>
            {renderEditButton('achievement')}
          </div>
        </CardHeader>
        <CardContent>
          {(!user.achievements || user.achievements.length === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-4">実績情報はありません</p>
          ) : (
            <div className="space-y-3">
              {user.achievements.map((achievement) => (
                <div key={achievement.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{achievement.title}</h4>
                    {achievement.date && (
                      <span className="text-sm text-muted-foreground">
                        {new Date(achievement.date).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </div>
                  {achievement.description && (
                    <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 変更申請ダイアログ（一般社員向け） */}
      <Dialog open={changeRequestOpen} onOpenChange={setChangeRequestOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              資格情報の変更申請
            </DialogTitle>
            <DialogDescription>
              変更内容を記入して申請してください。人事担当者が確認・承認します。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>変更内容</Label>
              <Textarea
                placeholder="例: 基本情報処理技術者試験に合格しました。取得日: 2025/04/15、証書番号: FE-2025-XXXXX"
                value={changeRequestNote}
                onChange={(e) => setChangeRequestNote(e.target.value)}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                資格取得、スキル追加、職歴更新など、変更したい内容を具体的に記入してください。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeRequestOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleChangeRequest}>
              <Send className="mr-2 h-4 w-4" />
              申請する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HR直接編集ダイアログ（簡易版 - 今後拡張） */}
      <Dialog open={editSection !== null} onOpenChange={(open) => !open && setEditSection(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editSection === 'qualification' && '資格・免許の編集'}
              {editSection === 'skill' && 'スキルの編集'}
              {editSection === 'career' && '職歴の編集'}
              {editSection === 'achievement' && '実績の編集'}
            </DialogTitle>
            <DialogDescription>
              この機能は今後のアップデートで実装されます。
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>編集機能は準備中です。</p>
            <p className="text-sm mt-2">現在はAPIまたはCSVインポートで更新してください。</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSection(null)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
