'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: { id: string; name: string } | null;
  onSuccess?: () => void;
}

export function DeleteDepartmentDialog({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DeleteDepartmentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!department) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/organization/departments/${department.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '削除に失敗しました');
      }

      toast.success('部門を削除しました');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Delete department failed:', error);
      toast.error(error instanceof Error ? error.message : '削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            部門の削除
          </DialogTitle>
          <DialogDescription>
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm">
            <strong>「{department?.name}」</strong> を削除しますか？
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            子部門がある場合は削除できません。先に子部門を削除または移動してください。
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                削除中...
              </>
            ) : (
              '削除'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
