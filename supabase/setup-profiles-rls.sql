-- profiles テーブル（user_idと1:1）
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user',
  organization_id UUID REFERENCES public.organizations(id),
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 自分のプロフィールは自分だけ読める
CREATE POLICY "Users can view own profile" 
  ON public.profiles
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 自分のプロフィールは自分だけ作成できる
CREATE POLICY "Users can insert own profile" 
  ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 自分のプロフィールは自分だけ更新できる
CREATE POLICY "Users can update own profile" 
  ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- サインアップ時に自動でプロフィール作成
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles(
    user_id, 
    full_name, 
    role,
    organization_id,
    department
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Demo User'),
    COALESCE(new.raw_user_meta_data->>'role', 'demo'),
    '11111111-1111-1111-1111-111111111111'::UUID, -- デモ組織ID
    COALESCE(new.raw_user_meta_data->>'department', '営業部')
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- トリガーの削除と再作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- デモ組織が存在しない場合は作成
INSERT INTO public.organizations (id, name, slug)
VALUES ('11111111-1111-1111-1111-111111111111', 'デモ組織', 'demo')
ON CONFLICT (id) DO NOTHING;