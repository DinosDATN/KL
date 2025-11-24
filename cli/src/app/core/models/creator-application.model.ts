export interface CreatorApplication {
  id: number;
  user_id: number;
  specialization: string;
  work_experience: WorkExperience[];
  skills: string[];
  certificates?: Certificate[];
  portfolio?: PortfolioItem[];
  bio: string;
  teaching_experience?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  User?: {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    role: 'user' | 'creator' | 'admin';
    Profile?: {
      bio?: string;
      phone?: string;
      address?: string;
      website_url?: string;
      github_url?: string;
      linkedin_url?: string;
      birthday?: string;
      gender?: 'male' | 'female' | 'other';
    };
  };
  Reviewer?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface WorkExperience {
  years: number;
  position: string;
  company: string;
}

export interface Certificate {
  type: string;
  url?: string;
  file_url?: string;
}

export interface PortfolioItem {
  type: 'github' | 'gitlab' | 'website' | 'product' | 'other';
  url: string;
}

export interface CreatorApplicationFormData {
  specialization: string;
  work_experience: WorkExperience[];
  skills: string[];
  certificates?: Certificate[];
  portfolio?: PortfolioItem[];
  bio: string;
  teaching_experience?: string;
}

