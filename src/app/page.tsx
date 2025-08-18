import { redirect } from 'next/navigation';

// 動的レンダリングを強制
export const dynamic = 'force-dynamic';

export default function RootPage() {
  redirect('/ja');
}