export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  bonus_xp: number;
  created_at: string;
  updated_at?: string | null;
}
