'use client';

import { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormComponentProps } from '@/lib/workflow/schemas';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function CommuteRouteChangeForm({ form, onFlowUpdate }: FormComponentProps) {
  const [transportMethod, setTransportMethod] = useState<'public' | 'private' | ''>('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-orange-600" />
          通勤経路変更
        </CardTitle>
        <CardDescription>
          通勤経路や通勤手段を変更します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 確認事項 */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="font-medium text-gray-900 mb-3">
            以下の項目を必ずお読みいただき、チェックしてください
          </h4>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation1"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.transportAllowanceCompliance')}
              />
              <Label htmlFor="confirmation1" className="text-sm cursor-pointer">
                交通費は、社会通念上最も経済的かつ合理的と認められる経路および方法により算出された金額を支給します
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation2"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.remoteWorkDailyCalculation')}
              />
              <Label htmlFor="confirmation2" className="text-sm cursor-pointer">
                在宅勤務制度を利用する場合、交通費は日割り計算となります
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation3"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.expenseDeadline')}
              />
              <Label htmlFor="confirmation3" className="text-sm cursor-pointer">
                交通費の精算は毎月末日までに申請してください
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="confirmation4"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('confirmations.bicycleProhibition')}
              />
              <Label htmlFor="confirmation4" className="text-sm cursor-pointer">
                自転車通勤は原則禁止です（特別な事情がある場合は人事部に相談してください）
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>
          </div>
        </div>

        {/* 通勤方法 */}
        <div className="space-y-2">
          <Label htmlFor="transportMethod">
            通勤方法
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Select onValueChange={(value) => {
            setTransportMethod(value as 'public' | 'private');
            form.setValue('transportMethod', value);
          }}>
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">公共交通機関</SelectItem>
              <SelectItem value="private">自家用車</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 公共交通機関の場合 */}
        {transportMethod === 'public' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                <strong>入力例：</strong>
                <br />
                自宅 → 新宿駅（JR山手線）→ 渋谷駅（東急東横線）→ 中目黒駅
                → 徒歩5分 → オフィス
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publicDeparture">
                  出発地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="publicDeparture"
                  placeholder="例：自宅最寄り駅"
                  {...form.register('publicTransit.departure')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicArrival">
                  到着地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="publicArrival"
                  placeholder="例：オフィス最寄り駅"
                  {...form.register('publicTransit.arrival')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicRouteDetails">
                経路詳細
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="publicRouteDetails"
                placeholder="使用する路線と駅を順番に記入してください&#10;例：自宅 → 新宿駅（JR山手線）→ 渋谷駅 → 徒歩 → オフィス"
                {...form.register('publicTransit.routeDetails')}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publicOneWayFare">
                  片道運賃
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="publicOneWayFare"
                    type="number"
                    className="pl-8"
                    placeholder="500"
                    {...form.register('publicTransit.oneWayFare', { valueAsNumber: true })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">円</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="publicTravelTime">
                  所要時間
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="publicTravelTime"
                  type="number"
                  placeholder="45"
                  {...form.register('publicTransit.travelTime', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">分</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicPassType">
                定期券種類
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select onValueChange={(value) => form.setValue('publicTransit.passType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">1ヶ月定期</SelectItem>
                  <SelectItem value="3months">3ヶ月定期</SelectItem>
                  <SelectItem value="6months">6ヶ月定期</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publicPassFare">
                定期券代金
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="publicPassFare"
                  type="number"
                  className="pl-8"
                  placeholder="15000"
                  {...form.register('publicTransit.passFare', { valueAsNumber: true })}
                />
              </div>
              <p className="text-xs text-muted-foreground">選択した定期券種類の金額を入力</p>
            </div>
          </div>
        )}

        {/* 自家用車の場合 */}
        {transportMethod === 'private' && (
          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-yellow-800">
                <strong>ご注意：</strong>
                <br />
                自家用車通勤には会社の承認が必要です。
                <br />
                駐車場代は自己負担となります。ガソリン代のみ支給対象です。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privateDeparture">
                  出発地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateDeparture"
                  placeholder="例：自宅"
                  {...form.register('privateCar.departure')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateArrival">
                  到着地
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateArrival"
                  placeholder="例：オフィス駐車場"
                  {...form.register('privateCar.arrival')}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privateDistance">
                  片道距離
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateDistance"
                  type="number"
                  step="0.1"
                  placeholder="15"
                  {...form.register('privateCar.distance', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">km（小数点1桁まで）</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateTravelTime">
                  所要時間
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateTravelTime"
                  type="number"
                  placeholder="30"
                  {...form.register('privateCar.travelTime', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">分</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateCarModel">
                車種
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="privateCarModel"
                placeholder="例：トヨタ プリウス"
                {...form.register('privateCar.carModel')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateLicensePlate">
                ナンバープレート
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="privateLicensePlate"
                placeholder="例：品川 500 あ 12-34"
                {...form.register('privateCar.licensePlate')}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="privateFuelType">
                  燃料タイプ
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select onValueChange={(value) => form.setValue('privateCar.fuelType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">ガソリン</SelectItem>
                    <SelectItem value="diesel">ディーゼル</SelectItem>
                    <SelectItem value="hybrid">ハイブリッド</SelectItem>
                    <SelectItem value="electric">電気</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateFuelEfficiency">
                  燃費
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  id="privateFuelEfficiency"
                  type="number"
                  step="0.1"
                  placeholder="20"
                  {...form.register('privateCar.fuelEfficiency', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">km/L（電気の場合はkm/kWh）</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="privateNeedParking"
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                {...form.register('privateCar.needParking')}
              />
              <div>
                <Label htmlFor="privateNeedParking" className="cursor-pointer">
                  駐車場を会社で手配してほしい
                </Label>
                <p className="text-xs text-muted-foreground">会社が駐車場を手配する場合、駐車場代は自己負担となります</p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                必要書類
              </h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>運転免許証のコピー</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>自動車保険証券のコピー</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-600">•</span>
                  <span>車検証のコピー</span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2">
                ※ 上記書類は人事部に直接提出してください
              </p>
            </div>
          </div>
        )}

        {/* 変更理由 */}
        <div className="space-y-2">
          <Label htmlFor="changeReason">
            変更理由
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Textarea
            id="changeReason"
            placeholder="通勤経路変更の理由を入力してください"
            {...form.register('changeReason')}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
