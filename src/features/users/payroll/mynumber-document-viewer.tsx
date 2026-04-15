'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface MynumberDocumentViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  docType: 'number' | 'identity';
  dependentDetailId?: string | null;
}

const docTypeLabels = {
  number: '番号確認書類',
  identity: '身元確認書類',
};

export function MynumberDocumentViewer({
  open, onOpenChange, userId, docType, dependentDetailId,
}: MynumberDocumentViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setError(null);
      return;
    }

    const fetchUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ docType });
        if (dependentDetailId) params.set('dependentDetailId', dependentDetailId);

        const res = await fetch(`/api/users/${userId}/mynumber/document?${params}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        setImageUrl(json.data.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : '書類の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUrl();
  }, [open, userId, docType, dependentDetailId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{docTypeLabels[docType]}を確認</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center min-h-[300px]">
          {loading && <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={docTypeLabels[docType]}
              className="max-w-full max-h-[60vh] object-contain rounded-md"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
