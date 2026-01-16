"use client";

import { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, X, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageData: string, blob: Blob) => void;
  maxSizeKB?: number;
  aspectRatio?: number;
  title?: string;
}

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
  maxSizeKB = 2048, // デフォルト2MB
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  aspectRatio: _aspectRatio = 4 / 3, // 将来的にアスペクト比制御で使用予定
  title = '写真を撮影',
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // カメラストリームの開始
  const startCamera = useCallback(async () => {
    try {
      // 既存のストリームを停止
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // MediaDevices API でカメラストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('カメラの起動に失敗しました:', error);
      toast.error('カメラの起動に失敗しました', {
        description: 'カメラへのアクセス権限を確認してください',
      });
    }
  }, [facingMode]);

  // カメラストリームの停止
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // 画像の撮影
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // キャンバスのサイズを設定
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 現在のビデオフレームをキャンバスに描画
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 画像データを取得
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);

    // カメラを停止
    stopCamera();

    toast.success('写真を撮影しました');
  }, [stopCamera]);

  // 画像のリサイズ（2MB以下に圧縮）
  const resizeImage = useCallback(
    async (imageData: string): Promise<{ dataUrl: string; blob: Blob }> => {
      return new Promise((resolve, reject) => {
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
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    resolve({
                      dataUrl: reader.result as string,
                      blob: blob,
                    });
                  };
                  reader.readAsDataURL(blob);
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
        img.src = imageData;
      });
    },
    [maxSizeKB]
  );

  // 撮影した画像を確定
  const confirmCapture = useCallback(async () => {
    if (!capturedImage) return;

    try {
      const { dataUrl, blob } = await resizeImage(capturedImage);
      onCapture(dataUrl, blob);
      setCapturedImage(null);
      onOpenChange(false);
      toast.success('画像を保存しました');
    } catch (error) {
      console.error('画像の処理に失敗しました:', error);
      toast.error('画像の処理に失敗しました');
    }
  }, [capturedImage, resizeImage, onCapture, onOpenChange]);

  // 再撮影
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  // カメラの切り替え（フロント/リア）
  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    if (isStreaming) {
      stopCamera();
      // 次のレンダリングサイクルでカメラを再起動
      setTimeout(() => {
        startCamera();
      }, 100);
    }
  }, [isStreaming, stopCamera, startCamera]);

  // モーダルが開かれたときにカメラを起動
  useEffect(() => {
    if (open && !capturedImage) {
      startCamera();
    }

    return () => {
      // クリーンアップ: モーダルが閉じられたときにカメラを停止
      if (!open) {
        stopCamera();
        setCapturedImage(null);
      }
    };
  }, [open, capturedImage, startCamera, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* プレビュー領域 */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {capturedImage ? (
              // 撮影済み画像
              <img
                src={capturedImage}
                alt="撮影済み"
                className="w-full h-full object-contain"
              />
            ) : (
              // カメラプレビュー
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}

            {/* キャンバス（非表示） */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* コントロール */}
          <div className="flex items-center justify-center gap-4">
            {capturedImage ? (
              // 撮影後のコントロール
              <>
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  再撮影
                </Button>
                <Button
                  onClick={confirmCapture}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  この画像を使用
                </Button>
              </>
            ) : (
              // 撮影前のコントロール
              <>
                <Button
                  variant="outline"
                  onClick={switchCamera}
                  className="gap-2"
                  disabled={!isStreaming}
                >
                  <RotateCcw className="h-4 w-4" />
                  カメラ切替
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                  disabled={!isStreaming}
                >
                  <Camera className="h-5 w-5" />
                  撮影
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  キャンセル
                </Button>
              </>
            )}
          </div>

          {/* 注意事項 */}
          {!capturedImage && (
            <div className="text-sm text-muted-foreground text-center">
              <p>カメラで書類や領収書を撮影してください</p>
              <p>自動的に{(maxSizeKB / 1024).toFixed(1)}MB以下に最適化されます</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
