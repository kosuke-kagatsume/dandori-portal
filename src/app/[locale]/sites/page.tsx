'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function SitesPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">現場管理</h1>
        <p className="text-muted-foreground">工事現場の情報を管理します</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            現場管理機能
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            この機能は現在開発中です。近日中に公開予定です。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}