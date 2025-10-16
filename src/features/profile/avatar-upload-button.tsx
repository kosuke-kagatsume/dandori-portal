'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadAvatar, validateImageFile } from '@/lib/storage/avatar-upload';

interface AvatarUploadButtonProps {
  userId: string;
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
}

export function AvatarUploadButton({
  userId,
  onUploadSuccess,
  onUploadError,
}: AvatarUploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // バリデーション
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      if (onUploadError) onUploadError(validation.error || 'Invalid file');
      return;
    }

    // アップロード開始
    setUploading(true);
    toast.loading('画像をアップロード中...');

    try {
      const result = await uploadAvatar({ userId, file });

      if (result.success && result.url) {
        toast.dismiss();
        toast.success('プロフィール画像をアップロードしました');
        onUploadSuccess(result.url);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'アップロードに失敗しました';
      toast.error(errorMessage);
      if (onUploadError) onUploadError(errorMessage);
    } finally {
      setUploading(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleButtonClick}
        disabled={uploading}
        className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-blue-50 hover:border-blue-500 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        title={uploading ? 'アップロード中...' : '画像を変更'}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        ) : (
          <Camera className="h-4 w-4 text-gray-600" />
        )}
      </button>
    </>
  );
}
