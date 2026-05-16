export interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  is_active?: boolean;
  
  preferred_currency?: string;
  created_at?: string;
  updated_at?: string;
}
