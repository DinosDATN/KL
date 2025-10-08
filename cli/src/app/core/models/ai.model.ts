export interface AIMessage {
  id: number;
  user_id: number;
  type: 'chat' | 'hint' | 'review' | 'progress_report';
  prompt?: string | null;
  response?: string | null;
  related_problem_id?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface AICodeReview {
  id: number;
  submission_id: number;
  review: string;
  score?: number | null;
  created_at: string;
  updated_at?: string | null;
}

// ChatAI Interfaces
export interface ChatAIRequest {
  question: string;
}

export interface ChatAIResponse {
  success: boolean;
  data?: {
    answer: string;
    data_source?: 'database' | 'ai_general';
    query_info?: {
      intent: string;
      query_types: string[];
      filters_applied: any;
    };
    suggestions?: string[];
    raw_data?: any;
  };
  message?: string;
  type?: string;
  timestamp: string;
}

export interface ChatAIMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatAIHealthStatus {
  success: boolean;
  ai_service?: {
    status: string;
    database?: string;
    services?: {
      query_parser: string;
      sql_builder: string;
      ai_client: string;
    };
  };
  backend_service?: {
    status: string;
    timestamp: string;
  };
  message?: string;
  error?: string;
}

export interface ChatAIStats {
  success: boolean;
  data?: {
    statistics: {
      courses?: { total: number; average_rating: number };
      problems?: { total: number; average_acceptance: number };
      documents?: { total: number; average_rating: number };
      contests?: { total: number };
    };
    status: string;
  };
  timestamp: string;
}
