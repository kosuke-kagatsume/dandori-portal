"use client";

import { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CameraCapture } from './camera-capture';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxSizeKB?: number;
  label?: string;
  description?: string;
  accept?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  maxSizeKB = 2048,
  label = '画像を追加',
  description = '写真を撮影するか、ファイルを選択してください',
  accept = 'image/jpeg,image/png,image/webp',
}: ImageUploadProps) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ファイル選択ダイアログを開く
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  // ファイルが選択されたときの処理
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // 最大枚数チェック
    if (value.length + files.length > maxImages) {
      toast.error(`画像は最大${maxImages}枚までアップロードできます`);
      return;
    }

    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // ファイルサイズチェック
      if (file.size > maxSizeKB * 1024) {
        toast.warning(`${file.name}は${(maxSizeKB / 1024).toFixed(1)}MBを超えているため、圧縮されます`);
      }

      try {
        const dataUrl = await fileToDataUrl(file, maxSizeKB);
        newImages.push(dataUrl);
      } catch (error) {
        console.error('画像の読み込みに失敗しました:', error);
        toast.error(`${file.name}の読み込みに失敗しました`);
      }
    }

    if (newImages.length > 0) {
      onChange([...value, ...newImages]);
      toast.success(`${newImages.length}枚の画像を追加しました`);
    }

    // ファイル選択をリセット（同じファイルを再度選択できるように）
    if (event.target) {
      event.target.value = '';
    }
  };

  // カメラで撮影した画像を追加
  const handleCameraCapture = (imageData: string) => {
    if (value.length >= maxImages) {
      toast.error(`画像は最大${maxImages}枚までアップロードできます`);
      return;
    }

    onChange([...value, imageData]);
  };

  // 画像を削除
  const handleRemove = (index: number) => {
    const newImages = [...value];
    newImages.splice(index, 1);
    onChange(newImages);
    toast.success('画像を削除しました');
  };

  // ファイルをData URLに変換（リサイズあり）
  const fileToDataUrl = (file: File, maxSizeKB: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file'));
          return;
        }

        // 画像のリサイズ処理
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // アスペクト比を維持しながらリサイズ
          let width = img.width;
          let height = img.height;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // 画質を段階的に下げてサイズを制限
          let quality = 0.9;
          const targetSizeKB = maxSizeKB;

          const compressImage = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to create blob'));
                  return;
                }

                const sizeKB = blob.size / 1024;

                if (sizeKB <= targetSizeKB || quality <= 0.1) {
                  // 目標サイズ以下、または最低品質に達した
                  const reader2 = new FileReader();
                  reader2.onloadend = () => {
                    resolve(reader2.result as string);
                  };
                  reader2.readAsDataURL(blob);
                } else {
                  // さらに圧縮
                  quality -= 0.1;
                  compressImage();
                }
              },
              'image/jpeg',
              quality
            );
          };

          compressImage();
        };
        img.onerror = reject;
        img.src = result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div>
        <h3 className="text-sm font-medium">{label}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* 画像一覧 */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((image, index) => (
            <Card key={index} className="relative group aspect-square overflow-hidden">
              <img
                src={image}
                alt={`画像 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* アップロードボタン */}
      {value.length < maxImages && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCameraOpen(true)}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            カメラで撮影
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleFileSelect}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            ファイルを選択
          </Button>

          {/* 隠しファイル入力 */}
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* 画像枚数表示 */}
      {value.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ImageIcon className="h-4 w-4" />
          <span>
            {value.length} / {maxImages} 枚
          </span>
        </div>
      )}

      {/* カメラモーダル */}
      <CameraCapture
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCameraCapture}
        maxSizeKB={maxSizeKB}
        title="領収書・書類を撮影"
      />
    </div>
  );
}
