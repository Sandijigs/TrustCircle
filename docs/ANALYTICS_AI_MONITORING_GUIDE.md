# TrustCircle Analytics & AI Monitoring Guide

## 🎯 Overview

Comprehensive guide for analytics, AI model monitoring, and fairness auditing in TrustCircle.

## 📊 Analytics Implementation

### What We Track

**User Journey Events** ✅:
- Wallet connection/disconnection
- Verification process (start, complete, fail)
- Loan requests (start, complete, fail)
- Loan approvals/rejections
- Disbursements
- Repayments
- Defaults
- Circle creation/joining
- Voting and vouching

**Platform Metrics** ✅:
- Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
- New user signups
- Retention rates (7-day, 30-day)
- Total Value Locked (TVL)
- Loan volume
- Default rates
- Interest collected

**What We DON'T Track** ❌:
- Real names or email addresses (unless user explicitly shares)
- Physical addresses
- Phone numbers
- Social security numbers
- Any PII (Personally Identifiable Information)

### Privacy-First Approach

1. **Address Hashing**:
   ```typescript
   // All wallet addresses are hashed before storage
   const hashedAddress = hashAddress(realAddress);
   ```

2. **Aggregation**:
   ```typescript
   // Exact amounts are aggregated into ranges
   const amountRange = aggregateAmount(1234); // Returns "1000-2000"
   ```

3. **Consent Required**:
   - Users must explicitly opt-in to analytics
   - GDPR-compliant consent management
   - Easy opt-out at any time

4. **Data Retention**:
   - Event data: 1 year
   - Model predictions: 2 years
   - Aggregate metrics: Indefinite

### Usage Example

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function LoanRequestForm() {
  const { track, startTimer } = useAnalytics();
  
  const handleSubmit = async (data) => {
    const timer = startTimer();
    
    try {
      await submitLoanRequest(data);
      
      track('loan_request_completed', {
        loanAmount: aggregateAmount(data.amount),
        duration: data.duration,
      });
      
      timer.end('loan_request_completed');
    } catch (error) {
      track('loan_request_failed', {
        errorMessage: error.message,
      });
    }
  };
}
```

## 🤖 AI Model Monitoring

### Why Model Monitoring is Critical

In AI-powered lending, poor model performance can lead to:
- ❌ Qualified borrowers being rejected (lost revenue)
- ❌ Unqualified borrowers being approved (defaults, losses)
- ❌ Discriminatory outcomes (legal/ethical issues)
- ❌ Loss of user trust

### Performance Metrics

1. **Accuracy** (Target: >75%)
   - Overall correct predictions
   - Tracked over time to detect degradation

2. **Precision** (Target: >70%)
   - Of loans predicted to repay, how many actually do?
   - High precision = fewer defaults

3. **Recall** (Target: >70%)
   - Of loans that repaid, how many did we predict correctly?
   - High recall = fewer missed opportunities

4. **F1 Score** (Target: >70%)
   - Harmonic mean of precision and recall
   - Balanced measure of model quality

5. **AUC-ROC** (Target: >0.75)
   - Model's discriminative ability
   - 0.5 = random, 1.0 = perfect

### Calibration

**Question**: If model says 80% chance of repayment, do 80% actually repay?

**Measurement**:
```typescript
const calibration = calculateCalibration(predictions);
// Expected Calibration Error (ECE) should be < 0.1
```

**Interpretation**:
- ECE < 0.05: Well calibrated ✅
- ECE 0.05-0.1: Acceptable ⚠️
- ECE > 0.1: Poorly calibrated ❌

**Action if poorly calibrated**:
- Recalibrate using Platt scaling or isotonic regression
- Review training data distribution

### Model Drift Detection

**Types of Drift**:

1. **Data Drift** (Covariate Shift)
   - Input feature distribution changes
   - Example: Average loan amount increases over time
   - Detection: Population Stability Index (PSI)

2. **Concept Drift**
   - Relationship between features and outcome changes
   - Example: Credit score becomes less predictive
   - Detection: Model performance degradation

3. **Label Drift**
   - Distribution of outcomes changes
   - Example: Default rate increases
   - Detection: Statistical tests on outcome distribution

**PSI Interpretation**:
- PSI < 0.1: No significant change ✅
- PSI 0.1-0.2: Moderate change ⚠️
- PSI >= 0.2: Significant change - investigate! 🚨

**Actions on Drift**:
1. Investigate cause (economic changes, user demographics, etc.)
2. Collect more recent training data
3. Retrain model with updated data
4. Consider adaptive learning approaches

### Monitoring Workflow

```
Daily:
├── Calculate model metrics (accuracy, precision, recall)
├── Check for significant drops (>5%)
└── Alert if metrics below threshold

Weekly:
├── Run drift detection
├── Analyze feature importance changes
└── Review calibration

Monthly:
├── Full fairness audit
├── Deep dive into model behavior
├── Plan model updates if needed
└── Executive report generation
```

## ⚖️ Fairness & Bias Detection

### Why Fairness Matters

In financial services, biased AI can:
- Violate Equal Credit Opportunity Act (ECOA)
- Lead to lawsuits and regulatory penalties
- Harm marginalized communities
- Damage company reputation
- Erode user trust

### Fairness Metrics

1. **Demographic Parity**
   - Are approval rates similar across groups?
   - Formula: |P(approved|Group A) - P(approved|Group B)|
   - Target: < 0.1 (< 10% difference)

2. **Equal Opportunity**
   - For people who would repay, are they approved at similar rates?
   - Formula: |P(approved|repaid, Group A) - P(approved|repaid, Group B)|
   - Target: < 0.1

3. **Disparate Impact** (80% Rule)
   - Ratio of approval rates
   - Formula: min(rate A, rate B) / max(rate A, rate B)
   - Legal threshold: >= 0.8

4. **Individual Fairness**
   - Similar individuals get similar predictions
   - Measured by prediction consistency among neighbors

### Bias Detection Workflow

```typescript
// 1. Run fairness audit
const report = runFairnessAudit(predictions);

// 2. Check overall fairness
if (report.overallFairness === 'significant-bias') {
  // CRITICAL: Pause model, investigate immediately
  await pauseModelDeployment();
  await alertSecurityTeam();
}

// 3. Review group metrics
report.groupMetrics.forEach(group => {
  if (group.approvalRate < 0.3) {
    // Low approval rate for specific group
    console.warn(`Low approval rate for ${group.groupName}`);
  }
});

// 4. Implement recommendations
report.recommendations.forEach(rec => {
  console.log(rec);
});
```

### Bias Mitigation Strategies

1. **Pre-processing** (Before Training):
   - Remove sensitive attributes (age, nationality)
   - Balance training data across groups
   - Use re-weighting techniques

2. **In-processing** (During Training):
   - Add fairness constraints to model
   - Use fairness-aware algorithms
   - Optimize for both accuracy and fairness

3. **Post-processing** (After Training):
   - Adjust decision thresholds per group
   - Calibrate predictions separately
   - Use reject-option classification

4. **Human-in-the-Loop**:
   - Human review for borderline cases
   - Appeals process for rejected applicants
   - Regular audits by domain experts

### Sensitive Attributes

**What to Avoid in Model**:
- ❌ Age
- ❌ Gender
- ❌ Race/ethnicity
- ❌ Nationality
- ❌ Religion
- ❌ Zip code (can be proxy for race)

**What's OK**:
- ✅ Transaction history
- ✅ Loan repayment history
- ✅ Account age
- ✅ Transaction patterns
- ✅ Verification status

**Important**: Even without directly using sensitive attributes, models can still be biased through correlated features!

## 🔄 Model Retraining Strategy

### When to Retrain

**Triggers**:
1. Model accuracy drops below 75%
2. Significant drift detected (PSI >= 0.2)
3. Fairness issues discovered
4. Major platform changes
5. Economic conditions change significantly
6. Scheduled: Every 3-6 months minimum

### Retraining Process

```
1. Data Collection
   ├── Gather new loan outcomes (repaid/defaulted)
   ├── Update feature engineering
   └── Ensure diverse, representative sample

2. Data Preparation
   ├── Clean and validate data
   ├── Handle missing values
   ├── Balance dataset if needed
   └── Split train/validation/test (70/15/15)

3. Model Training
   ├── Train on new data
   ├── Hyperparameter tuning
   ├── Cross-validation
   └── Ensemble methods if beneficial

4. Evaluation
   ├── Check all performance metrics
   ├── Run fairness audit
   ├── Test on held-out data
   └── Compare to current model

5. Deployment
   ├── A/B test new vs old model (if significant)
   ├── Gradual rollout
   ├── Monitor closely for first week
   └── Keep old model as fallback

6. Documentation
   ├── Document changes
   ├── Update model cards
   ├── Communicate to stakeholders
   └── Archive old model
```

### A/B Testing Framework

```typescript
// Route percentage of users to new model
function getModelVersion(userId: string): 'v1' | 'v2' {
  const hash = hashUserId(userId);
  const percentage = hash % 100;
  
  // 10% of users get new model
  return percentage < 10 ? 'v2' : 'v1';
}

// Track performance by version
async function scoreCredit(userId: string) {
  const version = getModelVersion(userId);
  const score = await callModel(version, userData);
  
  // Log for comparison
  await logPrediction({
    userId,
    modelVersion: version,
    score,
    timestamp: new Date(),
  });
  
  return score;
}
```

## 📈 Dashboards & Reporting

### Admin Analytics Dashboard

**Key Metrics**:
- DAU/WAU/MAU trend
- User funnel conversion rates
- Loan volume & TVL
- Default rates by credit score band
- Circle activity metrics

### Model Monitoring Dashboard

**Real-time Metrics**:
- Current accuracy, precision, recall
- Recent predictions distribution
- Drift alerts
- Calibration plot
- Feature importance

### Fairness Dashboard

**Fairness Metrics**:
- Demographic parity by group
- Disparate impact ratios
- Group-specific metrics
- Historical fairness trends
- Active bias alerts

## 🚨 Alerting System

### Critical Alerts (Immediate)

1. **Model accuracy < 70%**
   - Action: Investigate immediately, consider pausing
   
2. **Significant bias detected (disparate impact < 0.8)**
   - Action: Pause model, run full audit
   
3. **Drift PSI >= 0.3**
   - Action: Review data distribution, plan retraining

### Warning Alerts (Within 24h)

1. **Model accuracy 70-75%**
2. **Moderate bias (0.8 <= disparate impact < 0.9)**
3. **Drift PSI 0.2-0.3**
4. **High false positive/negative rate in specific group**

### Info Alerts (Weekly Review)

1. **Unusual feature values**
2. **Training data imbalance**
3. **Model confidence patterns**

## 📋 Best Practices

### Analytics

1. **Always get consent** before tracking
2. **Anonymize aggressively** - hash addresses, aggregate amounts
3. **Track outcomes, not just actions** - did user complete journey?
4. **Use cohorts** to understand retention
5. **A/B test changes** to measure impact

### Model Monitoring

1. **Monitor in production**, not just during training
2. **Track both aggregate and group-specific metrics**
3. **Set up automated alerts**, don't rely on manual checks
4. **Keep historical predictions** for drift detection
5. **Document everything** - model cards, decisions, changes

### Fairness

1. **Audit regularly** (monthly minimum)
2. **Test multiple fairness definitions** - no single metric is enough
3. **Involve domain experts** in audit review
4. **Be transparent** about how model works
5. **Have appeals process** for users
6. **Monitor intersectional fairness** (e.g., young + female)

## 🎓 Interpretability vs Accuracy Trade-off

### The Challenge

- Complex models (deep learning) = higher accuracy, less interpretable
- Simple models (logistic regression) = lower accuracy, more interpretable

### Financial Services Requirement

- Users have **right to explanation** for credit decisions
- Regulators require **model interpretability**
- "Black box" models face scrutiny

### Our Approach

1. **Start simple**: Logistic regression baseline
2. **Add complexity carefully**: Gradient boosting if needed
3. **Use SHAP/LIME** for explanations
4. **Provide reason codes** for rejections
5. **Human review available** for appeals

### Explanation Example

```
Your loan was rejected because:
1. Limited transaction history (30% impact)
2. Low on-chain credit score (25% impact)
3. Short account age (20% impact)
4. No verification badge (15% impact)
5. Other factors (10% impact)

You can improve by:
- Complete identity verification
- Build transaction history
- Request smaller loan amount initially
```

## 📚 Resources

### Learning

- [Fairness in ML (Google)](https://developers.google.com/machine-learning/crash-course/fairness)
- [Responsible AI Practices](https://ai.google/responsibilities/responsible-ai-practices/)
- [AI Fairness 360 (IBM)](https://aif360.mybluemix.net/)

### Tools

- **Monitoring**: Evidently AI, WhyLabs
- **Fairness**: AI Fairness 360, Fairlearn
- **Explainability**: SHAP, LIME
- **Analytics**: Mixpanel, PostHog, Amplitude

### Regulations

- Equal Credit Opportunity Act (ECOA)
- Fair Credit Reporting Act (FCRA)
- GDPR (Europe)
- CCPA (California)

---

**Last Updated**: November 2, 2025  
**Next Review**: Monthly
**Owner**: AI/ML Team

For questions: ai-ethics@trustcircle.io
