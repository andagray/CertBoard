-- CertBoard Initial Schema Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

create table public.profiles (
  id uuid references auth.users primary key,
  company_name text not null,
  email text not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'trialing',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now()
);

create table public.subcontractors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  trade text,
  notes text,
  upload_token uuid default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  subcontractor_id uuid references public.subcontractors(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  document_type text not null check (document_type in ('COI','W9','License','Bond','Other')),
  file_url text not null,
  file_name text not null,
  expiration_date date,
  status text default 'current' check (status in ('current','expiring_soon','expired','pending_review')),
  uploaded_by text default 'gc' check (uploaded_by in ('gc','subcontractor')),
  created_at timestamptz default now()
);

create table public.alert_log (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.documents(id) on delete cascade,
  alert_type text not null check (alert_type in ('60_day','30_day','7_day','expired')),
  sent_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.subcontractors enable row level security;
alter table public.documents enable row level security;
alter table public.alert_log enable row level security;

-- Profiles: Users can only read/update their own row
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Subcontractors: Users can CRUD their own subcontractors
create policy "Users can view own subcontractors"
  on public.subcontractors for select
  using (auth.uid() = user_id);

create policy "Users can insert own subcontractors"
  on public.subcontractors for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subcontractors"
  on public.subcontractors for update
  using (auth.uid() = user_id);

create policy "Users can delete own subcontractors"
  on public.subcontractors for delete
  using (auth.uid() = user_id);

-- Documents: Users can CRUD their own documents
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Alert Log: Users can read their own alerts (through documents)
create policy "Users can view own alerts"
  on public.alert_log for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = alert_log.document_id
      and documents.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE
-- ============================================

-- Create private storage bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- Storage policies: users can manage their own files
create policy "Users can upload documents"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own documents"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own documents"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- INDEXES
-- ============================================

create index idx_subcontractors_user_id on public.subcontractors(user_id);
create index idx_subcontractors_upload_token on public.subcontractors(upload_token);
create index idx_documents_subcontractor_id on public.documents(subcontractor_id);
create index idx_documents_user_id on public.documents(user_id);
create index idx_documents_expiration_date on public.documents(expiration_date);
create index idx_alert_log_document_id on public.alert_log(document_id);

-- ============================================
-- CRON (requires pg_cron extension enabled in Supabase)
-- Uncomment after deploying the Edge Function and replace the URL
-- ============================================

-- select cron.schedule(
--   'check-expirations',
--   '0 8 * * *',
--   $$
--   select net.http_post(
--     url := 'https://hzqguscfaqxwrhhitzrb.supabase.co/functions/v1/check-expirations',
--     headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6cWd1c2NmYXF4d3JoaGl0enJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMzE4MTcsImV4cCI6MjA4ODYwNzgxN30.MBsoRNEYzIKLQ89TJavJbMJ-wX8oRbn1SbRhw8iPBms"}'::jsonb
--   );
--   $$
-- );
