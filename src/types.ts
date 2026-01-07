export enum JobType {
  CHAT_BLOCK_ANALYSIS = "chat_block_analysis",
  DAY_AGGREGATION = "day_aggregation",
  WEEK_AGGREGATION = "week_aggregation",
  MONTH_AGGREGATION = "month_aggregation",
  TEST_DEBUG = "test_or_debug",
}

export enum JobStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  RETRYING = "retrying",
}

export type ModelId =
  | "gemma-3-27b"
  | "gemma-3-12b"
  | "gemma-3-4b"
  | "gemini-3-flash"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite";

export interface APIKeyUsage {
  requests: number;
  tokens: number;
  lastReset: Date;
  rpmLimit: number;
  tpmLimit: number;
  rpdLimit: number;
}

export interface APIKeyRecord {
  id: string;
  name: string;
  email?: string;
  encryptedKey: string;
  maskedKey: string;
  models: ModelId[];
  usage: Map<ModelId, APIKeyUsage>;
  isActive: boolean;
  createdAt: Date;
}

export interface JobRecord {
  id: string;
  type: JobType;
  status: JobStatus;
  model: ModelId;
  apiKeyId?: string;
  data: unknown;
  result?: unknown;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
  retries: number;
  error?: string;
  dependencies?: string[];
}

export interface BlockAnalysisResult {
  summary: string;
  emotions: string[];
  micro_preferences: Array<{
    category: "food" | "activity" | "topic" | "style";
    item: string;
    evidence: string;
    confidence: number;
  }>;
  avoidances: Array<{
    what: string;
    evidence: string;
    confidence: number;
  }>;
  communication_patterns: {
    initiative: "active" | "passive";
    message_length: "short" | "medium" | "long";
    response_speed: "fast" | "medium" | "slow";
    emoji_usage: "high" | "medium" | "low" | "none";
  };
  personality_indicators: string[];
  confidence_overall: number;
}

export interface DailyAggregationResult {
  date: string;
  daily_summary: string;
  emotional_timeline: Array<{
    time_range: "morning" | "afternoon" | "evening" | "night";
    dominant_emotion: string;
    intensity: number;
  }>;
  stable_likes: Array<{
    item: string;
    category: string;
    frequency: "high" | "medium" | "low";
    confidence: number;
    evidence_count: number;
  }>;
  stable_dislikes: Array<{
    item: string;
    category: string;
    severity: "high" | "medium" | "low";
    confidence: number;
    evidence_count: number;
  }>;
  communication_style: {
    overall: "active_engaging" | "passive_reactive" | "balanced";
    initiative_score: number;
    responsiveness_score: number;
    engagement_level: "high" | "medium" | "low";
    preferred_time: "morning" | "afternoon" | "evening";
  };
  personality_observations: Array<{
    trait: string;
    evidence: string;
    confidence: number;
  }>;
  interaction_recommendations: Array<{
    do: string[];
    avoid: string[];
    timing_suggestions: string[];
    topic_suggestions: string[];
  }>;
  confidence_metrics: {
    overall_confidence: number;
    data_coverage: "full" | "partial" | "minimal";
    consistency_score: number;
  };
}
