import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://yxefcwoirmdlqadqntjm.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4ZWZjd29pcm1kbHFhZHFudGptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1NjY4MTIsImV4cCI6MjEwNjE0MjgxMn0.g0ukMCrZpImdamdv1MOMqUeCkkPqcZcA6vd8Dt_mhiQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
