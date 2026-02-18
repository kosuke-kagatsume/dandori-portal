'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, FileIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { uploadFile, deleteFile, getPublicUrl } from '@/lib/storage/helpers';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

interface FileUploadProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  accept?: string;
  bucket?: string;
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 10,
  accept = 'image/*,.pdf,.doc,.docx',
  bucket = 'attachments',
  disabled = false,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);

    // ファイル数チェック
    if (value.length + files.length > maxFiles) {
      setError(`最大${maxFiles}個までアップロード可能です`);
      return;
    }

    // ファイルサイズチェック
    const oversizedFiles = files.filter(
      (file) => file.size > maxSize * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      setError(`ファイルサイズは${maxSize}MB以下にしてください`);
      return;
    }

    uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setError(null);

    try {
      const uploadPromises = files.map(async (file) => {
        // AWS S3にアップロード
        const { data, error: uploadError } = await uploadFile(bucket, file);

        if (uploadError) {
          throw new Error(uploadError);
        }

        if (!data) {
          throw new Error('アップロードに失敗しました');
        }

        const publicUrl = getPublicUrl(bucket, data.path);

        const uploadedFile: UploadedFile = {
          id: data.path,
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          uploadedAt: new Date().toISOString(),
        };

        return uploadedFile;
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const newFiles = [...value, ...uploadedFiles];
      onChange?.(newFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'アップロードに失敗しました');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async (fileToRemove: UploadedFile) => {
    try {
      // AWS S3から削除
      await deleteFile(bucket, fileToRemove.id);

      const newFiles = value.filter((file) => file.id !== fileToRemove.id);
      onChange?.(newFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ファイル削除に失敗しました');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* アップロードエリア */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50',
          error && 'border-red-300'
        )}
        onClick={!disabled ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled}
        />

        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">
          ファイルをクリックして選択
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {accept.split(',').join(', ')} (最大{maxSize}MB)
        </p>
        <p className="mt-1 text-xs text-gray-500">
          最大{maxFiles}個まで
        </p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* アップロード中表示 */}
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>アップロード中...</span>
        </div>
      )}

      {/* アップロード済みファイル一覧 */}
      {value.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            アップロード済みファイル ({value.length}/{maxFiles})
          </p>
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200"
            >
              <FileIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(file)}
                disabled={disabled}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
