'use client';

import { useState, useRef } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { uploadAvatar, validateImageFile } from '@/lib/storage/avatar-upload';
import { CameraCapture } from '@/components/camera/camera-capture';

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data URLからBlobを作成
  const dataURLtoBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // BlobからFileを作成
  const blobToFile = (blob: Blob, filename: string): File => {
    return new File([blob], filename, { type: blob.type });
  };

  // ファイルをアップロード
  const uploadFile = async (file: File) => {
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // カメラで撮影した画像を処理
  const handleCameraCapture = async (imageData: string, blob: Blob) => {
    const file = blobToFile(blob, `avatar-${Date.now()}.jpg`);
    await uploadFile(file);
  };

  const handleFileButtonClick = () => {
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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
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
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsCameraOpen(true)}>
            <Camera className="mr-2 h-4 w-4" />
            カメラで撮影
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleFileButtonClick}>
            <Upload className="mr-2 h-4 w-4" />
            ファイルを選択
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* カメラモーダル */}
      <CameraCapture
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCameraCapture}
        maxSizeKB={2048}
        aspectRatio={1}
        title="プロフィール画像を撮影"
      />
    </>
  );
}
