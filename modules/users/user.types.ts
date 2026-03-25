export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  avatar_url?: string | null;
  preferred_currency?: string;
  created_at?: string;
  updated_at?: string;
}
