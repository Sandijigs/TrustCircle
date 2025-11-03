-- TrustCircle Analytics Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ANALYTICS TABLES
-- ================================================

-- User events tracking
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address_hash VARCHAR(64), -- Hashed wallet address for privacy
  event_name VARCHAR(100) NOT NULL,
  event_properties JSONB DEFAULT '{}',
  session_id VARCHAR(100),
  platform VARCHAR(20) DEFAULT 'web',
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_user_events_address ON user_events(user_address_hash);
CREATE INDEX idx_user_events_name ON user_events(event_name);
CREATE INDEX idx_user_events_created ON user_events(created_at);
CREATE INDEX idx_user_events_session ON user_events(session_id);
CREATE INDEX idx_user_events_properties ON user_events USING gin(event_properties);

-- User properties (dimensions for analysis)
CREATE TABLE user_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address_hash VARCHAR(64) UNIQUE NOT NULL,
  credit_score INTEGER,
  total_loans INTEGER DEFAULT 0,
  active_loans INTEGER DEFAULT 0,
  completed_loans INTEGER DEFAULT 0,
  defaulted_loans INTEGER DEFAULT 0,
  total_borrowed NUMERIC(30, 18),
  total_repaid NUMERIC(30, 18),
  is_verified BOOLEAN DEFAULT FALSE,
  verification_method VARCHAR(50),
  circles_joined INTEGER DEFAULT 0,
  first_seen_at TIMESTAMP,
  last_seen_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_properties_address ON user_properties(user_address_hash);
CREATE INDEX idx_user_properties_credit_score ON user_properties(credit_score);
CREATE INDEX idx_user_properties_verified ON user_properties(is_verified);

-- Page views
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address_hash VARCHAR(64),
  page_name VARCHAR(200),
  url TEXT,
  referrer TEXT,
  session_id VARCHAR(100),
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_page_views_address ON page_views(user_address_hash);
CREATE INDEX idx_page_views_page ON page_views(page_name);
CREATE INDEX idx_page_views_created ON page_views(created_at);

-- ================================================
-- AI MODEL MONITORING TABLES
-- ================================================

-- Model predictions
CREATE TABLE model_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id VARCHAR(66), -- Transaction ID
  user_address_hash VARCHAR(64),
  predicted_score INTEGER NOT NULL,
  predicted_default_probability FLOAT NOT NULL,
  actual_outcome VARCHAR(20), -- 'repaid', 'defaulted', 'active'
  features JSONB, -- Store feature values for drift detection
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_model_predictions_loan ON model_predictions(loan_id);
CREATE INDEX idx_model_predictions_outcome ON model_predictions(actual_outcome);
CREATE INDEX idx_model_predictions_created ON model_predictions(created_at);
CREATE INDEX idx_model_predictions_user ON model_predictions(user_address_hash);

-- Model metrics (calculated periodically)
CREATE TABLE model_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name VARCHAR(50) NOT NULL,
  metric_value FLOAT NOT NULL,
  metric_metadata JSONB,
  time_period VARCHAR(20), -- 'daily', 'weekly', 'monthly'
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_model_metrics_name ON model_metrics(metric_name);
CREATE INDEX idx_model_metrics_created ON model_metrics(created_at);
CREATE INDEX idx_model_metrics_version ON model_metrics(model_version);

-- Model drift detection
CREATE TABLE model_drift_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_name VARCHAR(100),
  psi_score FLOAT NOT NULL,
  is_significant BOOLEAN DEFAULT FALSE,
  reference_period_start TIMESTAMP,
  reference_period_end TIMESTAMP,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drift_metrics_feature ON model_drift_metrics(feature_name);
CREATE INDEX idx_drift_metrics_significant ON model_drift_metrics(is_significant);
CREATE INDEX idx_drift_metrics_created ON model_drift_metrics(created_at);

-- ================================================
-- FAIRNESS AUDIT TABLES
-- ================================================

-- Fairness audit results
CREATE TABLE fairness_audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overall_fairness VARCHAR(20), -- 'fair', 'moderate-bias', 'significant-bias'
  demographic_parity FLOAT,
  equal_opportunity FLOAT,
  equalized_odds FLOAT,
  disparate_impact FLOAT,
  statistical_parity FLOAT,
  audit_period_start TIMESTAMP,
  audit_period_end TIMESTAMP,
  total_predictions INTEGER,
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_fairness_audits_fairness ON fairness_audits(overall_fairness);
CREATE INDEX idx_fairness_audits_created ON fairness_audits(created_at);

-- Group-level fairness metrics
CREATE TABLE fairness_group_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES fairness_audits(id),
  group_name VARCHAR(100) NOT NULL,
  total_count INTEGER,
  approval_rate FLOAT,
  default_rate FLOAT,
  average_score FLOAT,
  false_positive_rate FLOAT,
  false_negative_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_group_metrics_audit ON fairness_group_metrics(audit_id);
CREATE INDEX idx_group_metrics_group ON fairness_group_metrics(group_name);

-- Bias alerts
CREATE TABLE bias_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type VARCHAR(50), -- 'disparate_impact', 'demographic_parity', etc.
  severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  affected_groups TEXT[],
  metric_value FLOAT,
  threshold_value FLOAT,
  audit_id UUID REFERENCES fairness_audits(id),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_bias_alerts_severity ON bias_alerts(severity);
CREATE INDEX idx_bias_alerts_resolved ON bias_alerts(resolved);
CREATE INDEX idx_bias_alerts_created ON bias_alerts(created_at);

-- ================================================
-- PLATFORM METRICS TABLES
-- ================================================

-- Daily aggregated metrics
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_date DATE NOT NULL UNIQUE,
  dau INTEGER DEFAULT 0, -- Daily Active Users
  new_users INTEGER DEFAULT 0,
  loan_requests INTEGER DEFAULT 0,
  loans_approved INTEGER DEFAULT 0,
  loans_disbursed INTEGER DEFAULT 0,
  total_volume_disbursed NUMERIC(30, 18) DEFAULT 0,
  repayments_made INTEGER DEFAULT 0,
  total_volume_repaid NUMERIC(30, 18) DEFAULT 0,
  defaults INTEGER DEFAULT 0,
  deposits INTEGER DEFAULT 0,
  total_volume_deposited NUMERIC(30, 18) DEFAULT 0,
  withdrawals INTEGER DEFAULT 0,
  total_volume_withdrawn NUMERIC(30, 18) DEFAULT 0,
  tvl NUMERIC(30, 18), -- Total Value Locked
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_metrics_date ON daily_metrics(metric_date);

-- Cohort analysis
CREATE TABLE user_cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_name VARCHAR(100), -- e.g., '2025-01' (signup month)
  user_address_hash VARCHAR(64),
  signup_date DATE,
  first_loan_date DATE,
  first_repayment_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_cohorts_name ON user_cohorts(cohort_name);
CREATE INDEX idx_user_cohorts_signup ON user_cohorts(signup_date);
CREATE INDEX idx_user_cohorts_address ON user_cohorts(user_address_hash);

-- Retention metrics
CREATE TABLE retention_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_name VARCHAR(100),
  day_number INTEGER, -- Days since signup
  retained_users INTEGER,
  cohort_size INTEGER,
  retention_rate FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_retention_cohort ON retention_metrics(cohort_name);
CREATE INDEX idx_retention_day ON retention_metrics(day_number);

-- ================================================
-- MATERIALIZED VIEWS FOR DASHBOARDS
-- ================================================

-- User funnel (conversion rates at each stage)
CREATE MATERIALIZED VIEW user_funnel AS
SELECT
  COUNT(DISTINCT CASE WHEN event_name = 'wallet_connected' THEN user_address_hash END) as connected_wallet,
  COUNT(DISTINCT CASE WHEN event_name = 'verification_completed' THEN user_address_hash END) as completed_verification,
  COUNT(DISTINCT CASE WHEN event_name = 'loan_request_completed' THEN user_address_hash END) as requested_loan,
  COUNT(DISTINCT CASE WHEN event_name = 'loan_approved' THEN user_address_hash END) as approved_loan,
  COUNT(DISTINCT CASE WHEN event_name = 'loan_disbursed' THEN user_address_hash END) as received_loan,
  COUNT(DISTINCT CASE WHEN event_name = 'payment_made' THEN user_address_hash END) as made_payment,
  COUNT(DISTINCT CASE WHEN event_name = 'loan_completed' THEN user_address_hash END) as completed_loan
FROM user_events
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Credit score distribution
CREATE MATERIALIZED VIEW credit_score_distribution AS
SELECT
  CASE
    WHEN credit_score < 400 THEN 'poor'
    WHEN credit_score < 600 THEN 'fair'
    WHEN credit_score < 700 THEN 'good'
    WHEN credit_score < 800 THEN 'very_good'
    ELSE 'excellent'
  END as score_band,
  COUNT(*) as user_count,
  AVG(credit_score) as avg_score,
  AVG(total_loans) as avg_total_loans,
  AVG(CASE WHEN total_loans > 0 THEN defaulted_loans::FLOAT / total_loans END) as avg_default_rate
FROM user_properties
WHERE credit_score IS NOT NULL
GROUP BY score_band;

-- Refresh materialized views (run periodically)
-- REFRESH MATERIALIZED VIEW user_funnel;
-- REFRESH MATERIALIZED VIEW credit_score_distribution;

-- ================================================
-- DATA RETENTION POLICIES
-- ================================================

-- Function to delete old events (GDPR compliance)
CREATE OR REPLACE FUNCTION delete_old_events()
RETURNS void AS $$
BEGIN
  -- Delete events older than 1 year
  DELETE FROM user_events
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  DELETE FROM page_views
  WHERE created_at < NOW() - INTERVAL '1 year';
  
  -- Delete old predictions (keep for 2 years for analysis)
  DELETE FROM model_predictions
  WHERE created_at < NOW() - INTERVAL '2 years'
  AND actual_outcome IN ('repaid', 'defaulted');
END;
$$ LANGUAGE plpgsql;

-- Schedule periodic cleanup (use pg_cron or external scheduler)
-- SELECT cron.schedule('delete-old-events', '0 2 * * 0', 'SELECT delete_old_events()');

-- ================================================
-- HELPER FUNCTIONS
-- ================================================

-- Calculate conversion rate between two events
CREATE OR REPLACE FUNCTION calculate_conversion_rate(
  start_event VARCHAR(100),
  end_event VARCHAR(100),
  days INTEGER DEFAULT 30
)
RETURNS FLOAT AS $$
DECLARE
  start_count INTEGER;
  end_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_address_hash) INTO start_count
  FROM user_events
  WHERE event_name = start_event
  AND created_at >= NOW() - (days || ' days')::INTERVAL;
  
  SELECT COUNT(DISTINCT user_address_hash) INTO end_count
  FROM user_events
  WHERE event_name = end_event
  AND created_at >= NOW() - (days || ' days')::INTERVAL;
  
  IF start_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (end_count::FLOAT / start_count::FLOAT) * 100;
END;
$$ LANGUAGE plpgsql;

-- Get user journey timeline
CREATE OR REPLACE FUNCTION get_user_journey(user_hash VARCHAR(64))
RETURNS TABLE (
  event_name VARCHAR(100),
  event_time TIMESTAMP,
  days_since_start INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ue.event_name,
    ue.created_at as event_time,
    EXTRACT(DAY FROM (ue.created_at - MIN(ue.created_at) OVER ()))::INTEGER as days_since_start
  FROM user_events ue
  WHERE ue.user_address_hash = user_hash
  ORDER BY ue.created_at;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on sensitive tables
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_predictions ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can see all data
CREATE POLICY admin_all ON user_events
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Policy: Users can only see their own data
CREATE POLICY user_own_events ON user_events
  FOR SELECT
  USING (user_address_hash = auth.jwt() ->> 'address_hash');

-- ================================================
-- GRANTS
-- ================================================

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON user_events, page_views TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
