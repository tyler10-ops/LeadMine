// ── Billing ───────────────────────────────────────────────────────────────────

export type Plan = "free" | "miner" | "operator" | "brokerage";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete";

export interface Subscription {
  id: string;
  client_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan: Plan;
  billing_interval: "month" | "year" | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_end: string | null;
  created_at: string;
  updated_at: string;
}

// ── Entities ──────────────────────────────────────────────────────────────────

export interface Realtor {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  city: string;
  state: string | null;
  tagline: string | null;
  bio: string | null;
  photo_url: string | null;
  brand_color: string;
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export type ClientIndustry =
  | "roofing"
  | "plumbing"
  | "hvac"
  | "dental"
  | "legal"
  | "real_estate"
  | "landscaping"
  | "other";

export interface Client {
  id: string;
  user_id: string;
  business_name: string;
  industry: ClientIndustry | null;
  target_locations: string[];
  plan: Plan;
  created_at: string;
  updated_at: string;
}

export type LeadStage = "new" | "contacted" | "qualified" | "booked" | "dead";

export interface LeadQualification {
  budget_min?: number;
  budget_max?: number;
  timeline?: string;
  locations?: string[];
  property_type?: string;
  urgency?: "hot" | "warm" | "cold";
  pre_approved?: boolean;
  motivation?: string;
  objections?: string[];
}

export type GemGrade = "elite" | "refined" | "rock" | "ungraded";

export interface Lead {
  id: string;
  client_id?: string;
  email: string;
  /** @deprecated Use business_name instead */
  name?: string | null;
  business_name: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  rating: number | null;
  review_count: number | null;
  intent: "buyer" | "seller" | "investor" | "unknown" | "hot" | "warm" | "cold";
  gem_grade: GemGrade;
  company_name: string | null;
  industry: string | null;
  source_url: string | null;
  enrichment_data: Record<string, unknown> | null;
  score: number;
  source: string;
  notes: string | null;
  created_at: string;
  // Pipeline fields
  stage: LeadStage;
  stage_changed_at: string;
  last_contact_at: string | null;
  assigned_agent_id: string | null;
  qualification: LeadQualification;
  tags: string[];
  // Heat score fields (009_realtor_targeting migration)
  heat_score: number;
  heat_tier: HeatTier;
  heat_breakdown: HeatScoreBreakdown | null;
  heat_reasoning: string | null;
  heat_scored_at: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  realtor_id: string;
  lead_id: string | null;
  messages: ChatMessage[];
  summary: string | null;
  intent: string | null;
  gated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  realtor_id: string;
  type: "page_view" | "chat_start" | "lead_capture" | "content_view";
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Content {
  id: string;
  realtor_id: string;
  title: string;
  body: string;
  type: "market_pulse" | "buyer_tip" | "seller_warning";
  published: boolean;
  created_at: string;
}

export interface DailyMetric {
  id: string;
  realtor_id: string;
  date: string;
  page_views: number;
  chat_starts: number;
  leads_captured: number;
  buyer_leads: number;
  seller_leads: number;
  investor_leads: number;
}

export interface DashboardMetrics {
  totalLeads: number;
  buyerLeads: number;
  sellerLeads: number;
  investorLeads: number;
  totalConversations: number;
  totalPageViews: number;
  weeklyGrowth: number;
  estimatedPipeline: number;
  dailyMetrics: DailyMetric[];
  recentLeads: Lead[];
}

export interface ChatRequest {
  message: string;
  conversationId: string | null;
  realtorId: string;
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
  shouldGate: boolean;
  messageCount: number;
}

export interface LeadCaptureRequest {
  email: string;
  name?: string;
  conversationId: string;
  realtorId: string;
}

// ============================================
// AUTOMATION HUB TYPES
// ============================================

export type AssetType = "voice" | "sms" | "email" | "social" | "listing" | "booking";
export type AssetStatus = "active" | "paused" | "error";
export type AutomationStatus = "active" | "paused" | "error" | "draft";
export type LogOutcome = "success" | "failure" | "partial" | "skipped";
export type NewsCategory = "rates" | "inventory" | "policy" | "local" | "economy" | "forecast";

export interface AIAsset {
  id: string;
  realtor_id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  description: string | null;
  performance_score: number;
  response_success_rate: number;
  engagement_rate: number;
  completion_rate: number;
  error_rate: number;
  key_metric_label: string;
  key_metric_value: number;
  config: Record<string, unknown>;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AutomationAction {
  type: string;
  label: string;
  config: Record<string, unknown>;
}

export interface AutomationModules {
  call_routing?: { enabled: boolean; rules: string[] };
  follow_up_timing?: { enabled: boolean; delay_minutes: number; max_attempts: number };
  escalation?: { enabled: boolean; threshold: number; target: string };
  stop_conditions?: { enabled: boolean; conditions: string[] };
  human_takeover?: { enabled: boolean; trigger: string };
}

export interface Automation {
  id: string;
  realtor_id: string;
  asset_id: string | null;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  actions: AutomationAction[];
  status: AutomationStatus;
  success_rate: number;
  failure_rate: number;
  total_runs: number;
  modules: AutomationModules;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  realtor_id: string;
  automation_id: string | null;
  asset_id: string | null;
  timestamp: string;
  trigger_source: string;
  action_executed: string;
  outcome: LogOutcome;
  reason: string | null;
  ai_decision_summary: string | null;
  metadata: Record<string, unknown>;
  duration_ms: number | null;
  // Joined fields
  automation_name?: string;
  asset_name?: string;
}

export interface MarketNews {
  id: string;
  title: string;
  summary: string;
  body: string | null;
  source: string | null;
  source_url: string | null;
  category: NewsCategory;
  tags: string[];
  ai_analysis: string | null;
  region: string;
  published_at: string;
  created_at: string;
}

export interface AnalyticsSnapshot {
  id: string;
  realtor_id: string;
  date: string;
  ai_handled_leads: number;
  appointments_booked: number;
  estimated_commission: number;
  avg_response_time_ms: number;
  total_automations_run: number;
  success_count: number;
  failure_count: number;
  conversations_started: number;
}

export interface HubAnalytics {
  totals: {
    aiHandledLeads: number;
    appointmentsBooked: number;
    estimatedCommission: number;
    avgResponseTime: number;
    totalRuns: number;
    successRate: number;
  };
  daily: AnalyticsSnapshot[];
  assets: AIAsset[];
  automations: Automation[];
}

// ============================================
// MARKET INTELLIGENCE TYPES
// ============================================

export type SignalCategory = "rates" | "inventory" | "demand" | "policy" | "local_market" | "macro";
export type SignalDirection = "bullish" | "bearish" | "neutral";
export type SignalGeography = "national" | "state" | "local";
export type SourceType = "api" | "batch" | "manual" | "derived";
export type AlertChannel = "in_app" | "email" | "both";
export type InteractionType = "viewed" | "expanded" | "dismissed" | "acted_on";

export interface MarketSignal {
  id: string;
  source_name: string;
  source_type: SourceType;
  source_url: string | null;
  external_id: string | null;
  headline: string;
  summary: string | null;
  body: string | null;
  raw_data: Record<string, unknown>;
  category: SignalCategory;
  geography: SignalGeography;
  region: string;
  signal_direction: SignalDirection;
  confidence_score: number;
  impact_score: number;
  impact_factors: {
    breadth?: number;
    magnitude?: number;
    historical_relevance?: number;
    confidence?: number;
  };
  tags: string[];
  is_high_impact: boolean;
  status: "active" | "archived" | "retracted";
  published_at: string;
  expires_at: string | null;
  created_at: string;
  // Joined
  interpretation?: SignalInterpretation;
}

export interface SignalInterpretation {
  id: string;
  signal_id: string;
  ai_summary: string;
  ai_realtor_impact: string;
  ai_suggested_implication: string | null;
  affected_asset_types: AssetType[];
  asset_recommendations: AssetRecommendation[];
  model_used: string;
  prompt_version: string;
  generated_at: string;
  is_current: boolean;
}

export interface AssetRecommendation {
  asset_type: AssetType;
  action: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface AlertPreferences {
  id: string;
  realtor_id: string;
  categories: SignalCategory[];
  geographies: SignalGeography[];
  regions: string[];
  min_impact_score: number;
  signal_directions: SignalDirection[];
  alert_enabled: boolean;
  alert_channel: AlertChannel;
  max_alerts_per_day: number;
  last_alert_at: string | null;
  alerts_sent_today: number;
  created_at: string;
  updated_at: string;
}

export interface SignalHistoryEntry {
  id: string;
  category: SignalCategory;
  geography: SignalGeography;
  region: string;
  period_start: string;
  period_end: string;
  total_signals: number;
  bullish_count: number;
  bearish_count: number;
  neutral_count: number;
  avg_impact_score: number;
  avg_confidence_score: number;
  high_impact_count: number;
  period_type: "daily" | "weekly" | "monthly";
}

export interface SignalFeedFilters {
  category?: SignalCategory;
  geography?: SignalGeography;
  region?: string;
  direction?: SignalDirection;
  highImpactOnly?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SignalFeedResponse {
  signals: MarketSignal[];
  total: number;
  filters: SignalFeedFilters;
}

// ============================================
// LEAD PIPELINE & AI CALLING TYPES
// ============================================

export type CallDirection = "inbound" | "outbound";
export type CallStatus = "completed" | "no_answer" | "voicemail" | "busy" | "failed";
export type CallSentiment = "positive" | "neutral" | "negative" | "mixed";
export type CallOutcome = "appointment_set" | "follow_up_needed" | "not_interested" | "callback_requested" | "qualified" | "escalated";
export type FollowUpChannel = "call" | "sms" | "email";
export type FollowUpStatus = "pending" | "sent" | "delivered" | "opened" | "replied" | "failed";
export type AppointmentStatus = "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
export type MeetingType = "consultation" | "showing" | "listing_presentation" | "follow_up" | "closing";
export type ObjectionCategory = "price" | "timing" | "competition" | "financing" | "location" | "general";

export interface TranscriptEntry {
  speaker: "ai" | "lead";
  text: string;
  timestamp_ms: number;
  sentiment?: CallSentiment;
}

export interface CallRecord {
  id: string;
  realtor_id: string;
  lead_id: string;
  agent_id: string | null;
  direction: CallDirection;
  status: CallStatus;
  duration_seconds: number;
  transcript: TranscriptEntry[];
  recording_url: string | null;
  sentiment: CallSentiment;
  ai_summary: string | null;
  objections_raised: string[];
  outcome: CallOutcome | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  // Joined fields
  lead_name?: string;
  lead_email?: string;
  agent_name?: string;
}

export interface FollowUpActivity {
  id: string;
  realtor_id: string;
  lead_id: string;
  agent_id: string | null;
  channel: FollowUpChannel;
  status: FollowUpStatus;
  scheduled_at: string;
  completed_at: string | null;
  content: string | null;
  sequence_step: number;
  sequence_name: string | null;
  response_text: string | null;
  response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  realtor_id: string;
  lead_id: string;
  booked_by_agent_id: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: MeetingType;
  location: string | null;
  status: AppointmentStatus;
  conversation_summary: string | null;
  qualification_snapshot: LeadQualification;
  key_talking_points: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  agent_name?: string;
}

export interface ObjectionScript {
  id: string;
  realtor_id: string;
  agent_id: string | null;
  category: ObjectionCategory;
  objection_text: string;
  response_text: string;
  effectiveness_score: number;
  times_used: number;
  times_successful: number;
  created_at: string;
  updated_at: string;
}

export interface PipelineStats {
  total: number;
  byStage: Record<LeadStage, number>;
  conversionRate: number;
  staleCount: number;
}

export interface CallingAgentMetrics {
  asset: AIAsset;
  calls_today: number;
  calls_this_week: number;
  conversations_started: number;
  appointments_booked: number;
  conversion_rate: number;
  avg_duration: number;
  last_call_at: string | null;
}

export interface LeadTimelineEntry {
  type: "call" | "sms" | "email" | "stage_change" | "note" | "appointment";
  title: string;
  description: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface LeadDetail {
  lead: Lead;
  calls: CallRecord[];
  followUps: FollowUpActivity[];
  appointments: Appointment[];
  timeline: LeadTimelineEntry[];
  assignedAgent: AIAsset | null;
}

// ============================================
// NEWS FEED TYPES
// ============================================

export type NewsArticleCategory =
  | "housing_market"
  | "mortgage_rates"
  | "inventory"
  | "policy"
  | "buyer_seller_trends";

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  category: NewsArticleCategory;
}

// ============================================
// PROPERTY INTELLIGENCE TYPES
// ============================================

export type PropertyType =
  | "single_family"
  | "condo"
  | "multi_family"
  | "townhouse"
  | "land"
  | "commercial"
  | "mobile_home";

export type OpportunityType = "seller" | "buyer" | "investor";

export type MiningJobStatus = "queued" | "running" | "complete" | "failed" | "cancelled";
export type MiningJobPhase = "fetching" | "scoring" | "grading" | "saving" | "complete";

export type NotificationType =
  | "mining_complete"
  | "elite_gem_found"
  | "mining_failed"
  | "export_ready"
  | "system";

export interface SearchArea {
  id: string;
  realtor_id: string;
  name: string;
  zip_codes: string[];
  cities: string[];
  counties: string[];
  state: string | null;
  property_types: PropertyType[];
  min_years_owned: number;
  min_equity_pct: number;
  opportunity_types: OpportunityType[];
  last_mined_at: string | null;
  total_leads: number;
  created_at: string;
  updated_at: string;
  // Realtor targeting profile fields (009_realtor_targeting migration)
  min_price: number | null;
  max_price: number | null;
  lead_type_preference: 'buyers' | 'sellers' | 'both';
  seller_signals: string[];
  buyer_signals: string[];
  deal_goal: '1-2' | '3-5' | '5+';
  is_onboarding_profile: boolean;
}

export interface MiningJob {
  id: string;
  realtor_id: string;
  search_area_id: string | null;
  queue_job_id: string | null;
  status: MiningJobStatus;
  phase: MiningJobPhase | null;
  records_found: number;
  records_graded: number;
  records_saved: number;
  duplicates_skipped: number;
  elite_count: number;
  refined_count: number;
  rock_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  // Joined
  search_area?: SearchArea;
}

export interface Notification {
  id: string;
  realtor_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface PropertyLead extends Lead {
  // Property location
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  property_county: string | null;
  property_type: PropertyType | null;
  // Ownership
  owner_name: string | null;
  owner_mailing_address: string | null;
  owner_mailing_city: string | null;
  owner_mailing_state: string | null;
  owner_mailing_zip: string | null;
  is_absentee_owner: boolean;
  is_owner_occupied: boolean;
  years_owned: number | null;
  // Transaction history
  last_sale_date: string | null;
  last_sale_price: number | null;
  assessed_value: number | null;
  estimated_value: number | null;
  estimated_equity: number | null;
  equity_percent: number | null;
  // Opportunity scoring
  opportunity_type: OpportunityType | null;
  opportunity_score: number;
  signal_flags: string[];
  // Data provenance
  data_source: string;
  external_property_id: string | null;
  raw_property_data: Record<string, unknown> | null;
  search_area_id: string | null;
}

export interface PropertySignalBreakdown {
  score: number;
  grade: GemGrade;
  opportunity_type: OpportunityType;
  flags: string[];
  reasons: string[];
}

export interface LeadExport {
  id: string;
  realtor_id: string;
  lead_ids: string[];
  export_type: "csv" | "json";
  filters_used: Record<string, unknown>;
  record_count: number;
  exported_at: string;
}

// ============================================
// CREATIVE AGENT TYPES
// ============================================

export type CreativeLeadType = "buyers" | "sellers" | "both";
export type CreativeAdPlatform = "meta" | "google" | "instagram" | "tiktok";
export type CreativeJobStatus =
  | "pending"
  | "generating_copy"
  | "generating_images"
  | "complete"
  | "error";

export interface CreativeCopySet {
  headlines: string[];    // 5 variants, ~40 chars for Meta
  primaryText: string[];  // 3 body copy variants
  ctas: string[];         // 2 CTA options
  localHook: string;      // data-driven insight line
}

export interface CreativeImageVariant {
  url: string;
  prompt: string;
  style: "aerial" | "lifestyle" | "text_overlay";
  status: "generated" | "pending" | "error";
}

export interface AdCreative {
  id: string;
  client_id: string;
  county: string;
  state: string;
  lead_type: CreativeLeadType;
  equity_band: string;
  property_type: string;
  lead_count: number;
  copy: CreativeCopySet;
  images: CreativeImageVariant[];
  platforms: CreativeAdPlatform[];
  status: CreativeJobStatus;
  created_at: string;
}

export interface CreativeGenerateRequest {
  county: string;
  state: string;
  leadType: CreativeLeadType;
  equityBand: string;
  propertyType: string;
  leadCount: number;
  avgYearsOwned?: number;
}

// ============================================
// FRED API TYPES
// ============================================

export interface FredObservation {
  date: string;
  value: number;
}

export interface FredSeriesData {
  seriesId: string;
  title: string;
  observations: FredObservation[];
  lastUpdated: string;
}

// ============================================
// HEAT SCORE TYPES
// ============================================

export type HeatTier = 'cold' | 'warm' | 'hot' | 'diamond';

export interface HeatScoreBreakdown {
  location_match: number;       // max 20
  property_intent: number;      // max 25
  recent_activity: number;      // max 20
  property_value: number;       // max 10
  contact_completeness: number; // max 10
  market_competition: number;   // max 5
  behavior_signals: number;     // max 10
}

export interface HeatScoreResult {
  score: number;
  tier: HeatTier;
  breakdown: HeatScoreBreakdown;
  reasoning: string;
}

// ============================================
// OUTREACH TYPES
// ============================================

export type OutreachChannel = 'email' | 'sms' | 'call_script';
export type OutreachTone = 'professional' | 'casual' | 'urgent';
export type OutreachStatus = 'draft' | 'approved' | 'sent' | 'rejected';

export interface OutreachDraft {
  id: string;
  realtor_id: string;
  lead_id: string;
  subject: string | null;
  body: string;
  channel: OutreachChannel;
  tone: OutreachTone;
  status: OutreachStatus;
  ai_model: string | null;
  created_at: string;
  updated_at: string;
}
