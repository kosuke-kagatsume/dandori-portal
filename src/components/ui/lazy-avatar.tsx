'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface LazyAvatarProps {
  src?: string;
  alt?: string;
  fallback: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export function LazyAvatar({
  src,
  alt,
  fallback,
  className,
  threshold = 0.1,
  rootMargin = '50px',
}: LazyAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isIntersecting, setIsIntersecting] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isIntersecting) {
            setIsIntersecting(true);

            // 画像がある場合のみプリロード
            if (src) {
              const img = new Image();
              img.src = src;

              img.onload = () => {
                setImageSrc(src);
              };

              img.onerror = () => {
                // エラーの場合はフォールバック表示
                setImageSrc('');
              };
            }

            // 一度表示したら監視を停止
            if (avatarRef.current) {
              observer.unobserve(avatarRef.current);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (avatarRef.current) {
      observer.observe(avatarRef.current);
    }

    return () => {
      if (avatarRef.current) {
        observer.unobserve(avatarRef.current);
      }
    };
  }, [src, threshold, rootMargin, isIntersecting]);

  return (
    <Avatar ref={avatarRef} className={cn('transition-opacity duration-300', className)}>
      {isIntersecting && imageSrc && (
        <AvatarImage src={imageSrc} alt={alt} />
      )}
      <AvatarFallback className={!isIntersecting ? 'animate-pulse' : ''}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}