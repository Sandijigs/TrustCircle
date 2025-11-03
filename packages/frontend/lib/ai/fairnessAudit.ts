/**
 * Fairness Auditing
 * 
 * Detect and measure bias in AI credit scoring model.
 * Ensures fair treatment across demographic groups.
 */

export interface FairnessMetrics {
  demographicParity: number; // 0 = perfect parity, 1 = maximum disparity
  equalOpportunity: number;
  equalizedOdds: number;
  disparateImpact: number; // Should be close to 1.0
  statisticalParity: number;
}

export interface GroupMetrics {
  groupName: string;
  totalCount: number;
  approvalRate: number;
  defaultRate: number;
  averageScore: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

export interface BiasReport {
  overallFairness: 'fair' | 'moderate-bias' | 'significant-bias';
  metrics: FairnessMetrics;
  groupMetrics: GroupMetrics[];
  recommendations: string[];
  timestamp: Date;
}

/**
 * Calculate Demographic Parity
 * Measures if approval rates are similar across groups
 * 
 * Goal: P(approved | group A) ≈ P(approved | group B)
 */
export function calculateDemographicParity(
  groupA: { approved: number; total: number },
  groupB: { approved: number; total: number }
): number {
  const rateA = groupA.approved / groupA.total;
  const rateB = groupB.approved / groupB.total;
  
  return Math.abs(rateA - rateB);
}

/**
 * Calculate Equal Opportunity
 * Measures if true positive rates are similar across groups
 * (Among those who would repay, are they approved at similar rates?)
 * 
 * Goal: P(approved | repaid, group A) ≈ P(approved | repaid, group B)
 */
export function calculateEqualOpportunity(
  groupA: { truePositives: number; actualPositives: number },
  groupB: { truePositives: number; actualPositives: number }
): number {
  const tprA = groupA.truePositives / groupA.actualPositives;
  const tprB = groupB.truePositives / groupB.actualPositives;
  
  return Math.abs(tprA - tprB);
}

/**
 * Calculate Equalized Odds
 * Measures if both TPR and FPR are similar across groups
 * 
 * Goal: TPR and FPR should be equal across groups
 */
export function calculateEqualizedOdds(
  groupA: {
    truePositives: number;
    actualPositives: number;
    falsePositives: number;
    actualNegatives: number;
  },
  groupB: {
    truePositives: number;
    actualPositives: number;
    falsePositives: number;
    actualNegatives: number;
  }
): number {
  const tprA = groupA.truePositives / groupA.actualPositives;
  const tprB = groupB.truePositives / groupB.actualPositives;
  const fprA = groupA.falsePositives / groupA.actualNegatives;
  const fprB = groupB.falsePositives / groupB.actualNegatives;
  
  const tprDiff = Math.abs(tprA - tprB);
  const fprDiff = Math.abs(fprA - fprB);
  
  return (tprDiff + fprDiff) / 2;
}

/**
 * Calculate Disparate Impact
 * Ratio of approval rates between groups
 * 
 * 80% rule: Ratio should be >= 0.8
 * If ratio < 0.8, there may be disparate impact
 */
export function calculateDisparateImpact(
  groupA: { approved: number; total: number },
  groupB: { approved: number; total: number }
): number {
  const rateA = groupA.approved / groupA.total;
  const rateB = groupB.approved / groupB.total;
  
  // Return ratio (smaller / larger) so it's always <= 1
  return Math.min(rateA, rateB) / Math.max(rateA, rateB);
}

/**
 * Calculate Statistical Parity Difference
 * Similar to demographic parity but as difference rather than ratio
 */
export function calculateStatisticalParity(
  groupA: { approved: number; total: number },
  groupB: { approved: number; total: number }
): number {
  const rateA = groupA.approved / groupA.total;
  const rateB = groupB.approved / groupB.total;
  
  return rateA - rateB;
}

/**
 * Comprehensive fairness audit
 */
export function runFairnessAudit(
  predictions: Array<{
    id: string;
    predicted: 'approved' | 'rejected';
    actual: 'repaid' | 'defaulted' | 'active';
    group: string; // e.g., 'age_18-25', 'age_26-35', etc.
  }>
): BiasReport {
  // Group predictions by demographic group
  const groups = new Map<string, any[]>();
  predictions.forEach((p) => {
    if (!groups.has(p.group)) {
      groups.set(p.group, []);
    }
    groups.get(p.group)!.push(p);
  });

  const groupMetrics: GroupMetrics[] = [];
  
  // Calculate metrics for each group
  groups.forEach((items, groupName) => {
    const completed = items.filter(
      (p) => p.actual === 'repaid' || p.actual === 'defaulted'
    );
    
    const approved = items.filter((p) => p.predicted === 'approved').length;
    const defaulted = completed.filter((p) => p.actual === 'defaulted').length;
    
    // Calculate confusion matrix values
    const truePositives = completed.filter(
      (p) => p.predicted === 'approved' && p.actual === 'repaid'
    ).length;
    const falsePositives = completed.filter(
      (p) => p.predicted === 'approved' && p.actual === 'defaulted'
    ).length;
    const trueNegatives = completed.filter(
      (p) => p.predicted === 'rejected' && p.actual === 'defaulted'
    ).length;
    const falseNegatives = completed.filter(
      (p) => p.predicted === 'rejected' && p.actual === 'repaid'
    ).length;
    
    const actualPositives = truePositives + falseNegatives;
    const actualNegatives = trueNegatives + falsePositives;
    
    groupMetrics.push({
      groupName,
      totalCount: items.length,
      approvalRate: approved / items.length,
      defaultRate: defaulted / completed.length,
      averageScore: 0, // Would calculate from actual scores
      falsePositiveRate: actualNegatives > 0 ? falsePositives / actualNegatives : 0,
      falseNegativeRate: actualPositives > 0 ? falseNegatives / actualPositives : 0,
    });
  });

  // Calculate fairness metrics between groups
  const metrics = calculateFairnessMetrics(groupMetrics);
  
  // Determine overall fairness level
  const overallFairness = determineFairnessLevel(metrics);
  
  // Generate recommendations
  const recommendations = generateRecommendations(metrics, groupMetrics);

  return {
    overallFairness,
    metrics,
    groupMetrics,
    recommendations,
    timestamp: new Date(),
  };
}

/**
 * Calculate fairness metrics across all groups
 */
function calculateFairnessMetrics(groups: GroupMetrics[]): FairnessMetrics {
  if (groups.length < 2) {
    return {
      demographicParity: 0,
      equalOpportunity: 0,
      equalizedOdds: 0,
      disparateImpact: 1,
      statisticalParity: 0,
    };
  }

  // Compare all pairs of groups
  let maxDemographicParity = 0;
  let maxEqualOpportunity = 0;
  let maxEqualizedOdds = 0;
  let minDisparateImpact = 1;
  let maxStatisticalParity = 0;

  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const groupA = groups[i];
      const groupB = groups[j];

      // Demographic parity
      const dp = Math.abs(groupA.approvalRate - groupB.approvalRate);
      maxDemographicParity = Math.max(maxDemographicParity, dp);

      // Equal opportunity (using FNR as proxy)
      const eo = Math.abs(groupA.falseNegativeRate - groupB.falseNegativeRate);
      maxEqualOpportunity = Math.max(maxEqualOpportunity, eo);

      // Equalized odds (average of TPR and FPR differences)
      const fprDiff = Math.abs(groupA.falsePositiveRate - groupB.falsePositiveRate);
      const eodd = (eo + fprDiff) / 2;
      maxEqualizedOdds = Math.max(maxEqualizedOdds, eodd);

      // Disparate impact
      const di = Math.min(groupA.approvalRate, groupB.approvalRate) /
                 Math.max(groupA.approvalRate, groupB.approvalRate);
      minDisparateImpact = Math.min(minDisparateImpact, di);

      // Statistical parity
      const sp = Math.abs(groupA.approvalRate - groupB.approvalRate);
      maxStatisticalParity = Math.max(maxStatisticalParity, sp);
    }
  }

  return {
    demographicParity: maxDemographicParity,
    equalOpportunity: maxEqualOpportunity,
    equalizedOdds: maxEqualizedOdds,
    disparateImpact: minDisparateImpact,
    statisticalParity: maxStatisticalParity,
  };
}

/**
 * Determine overall fairness level
 */
function determineFairnessLevel(metrics: FairnessMetrics): 'fair' | 'moderate-bias' | 'significant-bias' {
  // Check 80% rule for disparate impact
  if (metrics.disparateImpact < 0.8) {
    return 'significant-bias';
  }

  // Check demographic parity (difference should be < 10%)
  if (metrics.demographicParity > 0.1) {
    return 'moderate-bias';
  }

  // Check equal opportunity (difference should be < 10%)
  if (metrics.equalOpportunity > 0.1) {
    return 'moderate-bias';
  }

  return 'fair';
}

/**
 * Generate recommendations for bias mitigation
 */
function generateRecommendations(
  metrics: FairnessMetrics,
  groups: GroupMetrics[]
): string[] {
  const recommendations: string[] = [];

  // Check disparate impact
  if (metrics.disparateImpact < 0.8) {
    recommendations.push(
      '🚨 CRITICAL: Disparate impact detected (< 80%). Review approval criteria to ensure fairness.'
    );
    recommendations.push(
      'Consider: 1) Removing correlated features, 2) Retraining with balanced data, 3) Post-processing to equalize rates'
    );
  }

  // Check demographic parity
  if (metrics.demographicParity > 0.1) {
    const sortedGroups = [...groups].sort((a, b) => a.approvalRate - b.approvalRate);
    const lowest = sortedGroups[0];
    const highest = sortedGroups[sortedGroups.length - 1];
    
    recommendations.push(
      `⚠️ Approval rate gap: ${(highest.approvalRate * 100).toFixed(1)}% (${highest.groupName}) vs ${(lowest.approvalRate * 100).toFixed(1)}% (${lowest.groupName})`
    );
    recommendations.push(
      `Investigate: Why is ${lowest.groupName} approved less frequently?`
    );
  }

  // Check equal opportunity
  if (metrics.equalOpportunity > 0.1) {
    recommendations.push(
      '⚠️ Unequal opportunity detected. Qualified applicants from some groups are being rejected at higher rates.'
    );
    recommendations.push(
      'Consider: Adjusting decision thresholds per group to equalize true positive rates'
    );
  }

  // Check for high false positive rates in any group
  groups.forEach((group) => {
    if (group.falsePositiveRate > 0.2) {
      recommendations.push(
        `⚠️ High false positive rate for ${group.groupName}: ${(group.falsePositiveRate * 100).toFixed(1)}%`
      );
    }
    if (group.falseNegativeRate > 0.2) {
      recommendations.push(
        `⚠️ High false negative rate for ${group.groupName}: ${(group.falseNegativeRate * 100).toFixed(1)}%`
      );
    }
  });

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push('✅ Model shows fair treatment across groups');
    recommendations.push('Continue monitoring: Run fairness audits monthly');
  } else {
    recommendations.push('');
    recommendations.push('Immediate actions:');
    recommendations.push('1. Pause new loan approvals if critical bias detected');
    recommendations.push('2. Review feature engineering and data collection');
    recommendations.push('3. Consider using fairness-aware machine learning algorithms');
    recommendations.push('4. Implement human review for borderline cases');
    recommendations.push('5. Conduct user research with affected groups');
  }

  return recommendations;
}

/**
 * Calculate Individual Fairness
 * Similar individuals should receive similar predictions
 */
export function calculateIndividualFairness(
  predictions: Array<{
    id: string;
    features: number[];
    score: number;
  }>
): number {
  let totalDifference = 0;
  let comparisons = 0;

  // Compare each prediction with its k nearest neighbors
  const k = 5;

  predictions.forEach((pred) => {
    const neighbors = findKNearestNeighbors(pred, predictions, k);
    
    neighbors.forEach((neighbor) => {
      const scoreDiff = Math.abs(pred.score - neighbor.score);
      totalDifference += scoreDiff;
      comparisons++;
    });
  });

  return comparisons > 0 ? totalDifference / comparisons : 0;
}

/**
 * Find k nearest neighbors based on feature similarity
 */
function findKNearestNeighbors(
  target: { id: string; features: number[] },
  all: Array<{ id: string; features: number[] }>,
  k: number
): Array<{ id: string; features: number[]; score: number; distance: number }> {
  const distances = all
    .filter((p) => p.id !== target.id)
    .map((p) => ({
      ...p,
      score: 0, // Would need actual score
      distance: euclideanDistance(target.features, p.features),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, k);

  return distances;
}

/**
 * Calculate Euclidean distance between two feature vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0)
  );
}

/**
 * Export fairness report
 */
export function exportFairnessReport(report: BiasReport): string {
  let output = 'FAIRNESS AUDIT REPORT\n';
  output += `Generated: ${report.timestamp.toISOString()}\n`;
  output += `Overall Assessment: ${report.overallFairness.toUpperCase()}\n`;
  output += '\n';

  output += 'FAIRNESS METRICS\n';
  output += '================\n';
  output += `Demographic Parity: ${(report.metrics.demographicParity * 100).toFixed(2)}%\n`;
  output += `Equal Opportunity: ${(report.metrics.equalOpportunity * 100).toFixed(2)}%\n`;
  output += `Equalized Odds: ${(report.metrics.equalizedOdds * 100).toFixed(2)}%\n`;
  output += `Disparate Impact: ${report.metrics.disparateImpact.toFixed(3)} ${report.metrics.disparateImpact >= 0.8 ? '✓' : '✗'}\n`;
  output += `Statistical Parity: ${(report.metrics.statisticalParity * 100).toFixed(2)}%\n`;
  output += '\n';

  output += 'GROUP METRICS\n';
  output += '=============\n';
  report.groupMetrics.forEach((group) => {
    output += `\n${group.groupName}:\n`;
    output += `  Total: ${group.totalCount}\n`;
    output += `  Approval Rate: ${(group.approvalRate * 100).toFixed(2)}%\n`;
    output += `  Default Rate: ${(group.defaultRate * 100).toFixed(2)}%\n`;
    output += `  FPR: ${(group.falsePositiveRate * 100).toFixed(2)}%\n`;
    output += `  FNR: ${(group.falseNegativeRate * 100).toFixed(2)}%\n`;
  });

  output += '\n';
  output += 'RECOMMENDATIONS\n';
  output += '===============\n';
  report.recommendations.forEach((rec) => {
    output += `${rec}\n`;
  });

  return output;
}
