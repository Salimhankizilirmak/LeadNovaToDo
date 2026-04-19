-- LEADNOVA B2B - CLERK & SUPABASE RLS UYUMLULUK PAKETI
-- Bu scripti Supabase SQL Editor'de (DASHBOARD) çalıştırın.

-- 1. VERİ TİPLERİ GÜNCELLEME (UUID -> TEXT)
-- Clerk ID'leri (user_...) string olduğu için kolon tiplerini tekst yapıyoruz.

ALTER TABLE public.org_members ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.organizations ALTER COLUMN owner_id TYPE TEXT;
ALTER TABLE public.projects ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE public.tasks ALTER COLUMN assignee_id TYPE TEXT;

-- 2. RLS POLİTİKALARINI TEMİZLEME VE YENİDEN KURMA
-- auth.uid() artık Clerk'ten gelen String 'sub' değerini döndürür.

-- ORG_MEMBERS: Kullanıcılar kendi üyeliklerini görebilmeli
DROP POLICY IF EXISTS "Users can see their own memberships" ON public.org_members;
CREATE POLICY "Users can see their own memberships"
ON public.org_members FOR SELECT
TO authenticated
USING (public.requesting_user_id() = user_id);

-- ORGANIZATIONS: Organizasyon üyeleri kendi şirket verilerini görebilmeli
DROP POLICY IF EXISTS "Members can see their organization" ON public.organizations;
CREATE POLICY "Members can see their organization"
ON public.organizations FOR SELECT
TO authenticated
USING (
  id IN (SELECT org_id FROM public.org_members WHERE user_id = public.requesting_user_id())
);

-- PROJECTS: Organizasyon üyeleri projeleri görebilir ve oluşturabilir
DROP POLICY IF EXISTS "Members can see projects" ON public.projects;
CREATE POLICY "Members can see projects"
ON public.projects FOR SELECT
TO authenticated
USING (
  org_id IN (SELECT org_id FROM public.org_members WHERE user_id = public.requesting_user_id())
);

DROP POLICY IF EXISTS "Members can insert projects" ON public.projects;
CREATE POLICY "Members can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (SELECT org_id FROM public.org_members WHERE user_id = public.requesting_user_id())
);

-- TASKS: Organizasyon üyeleri görevleri görebilir ve oluşturabilir
DROP POLICY IF EXISTS "Members can see tasks" ON public.tasks;
CREATE POLICY "Members can see tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT id FROM public.projects 
    WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = public.requesting_user_id())
  )
);

DROP POLICY IF EXISTS "Members can insert tasks" ON public.tasks;
CREATE POLICY "Members can insert tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  created_by = public.requesting_user_id()
);

-- 3. EK GÜVENLİK: Authenticated Role Zorunluluğu
-- Anonim isteklerin REST API üzerinden bu tablolara ulaşmasını engelliyoruz.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
