// Original AI models for database
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

// ChatAI Widget models
export interface ChatAIMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatAIRequest {
  question: string;
}

export interface ChatAIResponseData {
  answer: string;
  data_source: 'database' | 'ai_general';
  query_info?: {
    intent: string;
    query_types: string[];
    filters_applied: any;
  } | null;
  suggestions?: string[];
  raw_data?: any;
}

export interface ChatAIResponse {
  success: boolean;
  data?: ChatAIResponseData;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface ChatAIHealthStatus {
  success: boolean;
  data: {
    status: 'healthy' | 'unhealthy';
    ai_service: any;
    node_api: {
      status: string;
      uptime: number;
      memory?: any;
      timestamp: string;
    };
  };
  timestamp: string;
}

export interface ChatAIStats {
  success: boolean;
  data: {
    statistics?: {
      courses?: { total: number; average_rating: number };
      problems?: { total: number; average_acceptance: number };
      documents?: { total: number; average_rating: number };
      contests?: { total: number };
    };
  };
  timestamp: string;
}
