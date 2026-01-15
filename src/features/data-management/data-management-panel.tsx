'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Download } from 'lucide-react';
import { CSVImportPanel } from './csv-import-panel';
import { CSVExportPanel } from './csv-export-panel';

export function DataManagementPanel() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            インポート
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            エクスポート
          </TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-4">
          <CSVImportPanel />
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <CSVExportPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
