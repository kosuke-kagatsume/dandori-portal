import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

interface Props {
  params: { locale: string };
}

export default function HomePage({ params: { locale } }: Props) {
  // 静的生成の問題を回避するため、localeを設定
  setRequestLocale(locale);
  
  redirect(`/${locale}/dashboard`);
}