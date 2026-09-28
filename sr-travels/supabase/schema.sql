-- Supabase Idempotent Migration Script for SR Travels
-- Fixes "column 'status' does not exist" on pre-existing tables

-- 1. Create table if it doesn't exist at all
create table if not exists public.bookings (
  id uuid default gen_random_uuid() primary key
);

-- 2. Ensure all columns exist (adds missing columns if table already existed)
alter table public.bookings add column if not exists booking_code text;
alter table public.bookings add column if not exists name text;
alter table public.bookings add column if not exists phone text;
alter table public.bookings add column if not exists pickup_address text;
alter table public.bookings add column if not exists pickup_lat float8;
alter table public.bookings add column if not exists pickup_lng float8;
alter table public.bookings add column if not exists drop_address text;
alter table public.bookings add column if not exists drop_lat float8;
alter table public.bookings add column if not exists drop_lng float8;
alter table public.bookings add column if not exists distance_km float8;
alter table public.bookings add column if not exists trip_type text;
alter table public.bookings add column if not exists drive_mode text;
alter table public.bookings add column if not exists days int4 default 1;
alter table public.bookings add column if not exists vehicle_id text;
alter table public.bookings add column if not exists fare_total numeric;
alter table public.bookings add column if not exists travel_datetime text;
alter table public.bookings add column if not exists status text default 'new';
alter table public.bookings add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());

-- 3. Safely update constraints
alter table public.bookings drop constraint if exists bookings_phone_check;
alter table public.bookings drop constraint if exists bookings_name_check;
alter table public.bookings drop constraint if exists bookings_fare_total_check;
alter table public.bookings drop constraint if exists bookings_distance_km_check;
alter table public.bookings drop constraint if exists bookings_status_check;

alter table public.bookings add constraint bookings_phone_check check (phone ~ '^[6-9][0-9]{9}$');
alter table public.bookings add constraint bookings_name_check check (length(trim(name)) >= 2 and length(trim(name)) <= 60);
alter table public.bookings add constraint bookings_fare_total_check check (fare_total > 0 and fare_total < 100000);
alter table public.bookings add constraint bookings_distance_km_check check (distance_km > 0 and distance_km < 3000);
alter table public.bookings add constraint bookings_status_check check (status in ('new', 'confirmed', 'completed', 'cancelled'));

-- 4. Enable Row Level Security (RLS)
alter table public.bookings enable row level security;

-- 5. Drop all existing policies before recreating
drop policy if exists "Allow public insert" on public.bookings;
drop policy if exists "No public select" on public.bookings;
drop policy if exists "Allow admin select" on public.bookings;
drop policy if exists "Allow admin update" on public.bookings;
drop policy if exists "Allow admin delete" on public.bookings;

-- Policy A: Hardened Public Insert Policy
create policy "Allow public insert"
  on public.bookings
  for insert
  with check (
    status = 'new'
    and phone ~ '^[6-9][0-9]{9}$'
    and length(trim(name)) >= 2 and length(trim(name)) <= 60
    and fare_total > 0 and fare_total < 100000
    and distance_km > 0 and distance_km < 3000
  );

-- Policy B: Restricted Admin Select Policy
create policy "Allow admin select"
  on public.bookings
  for select
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@srtravels.com'
  );

-- Policy C: Restricted Admin Update Policy
create policy "Allow admin update"
  on public.bookings
  for update
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'admin@srtravels.com'
  )
  with check (
    (auth.jwt() ->> 'email') = 'admin@srtravels.com'
  );

-- Note: No DELETE policy is created. Deletions via client API are completely blocked.
