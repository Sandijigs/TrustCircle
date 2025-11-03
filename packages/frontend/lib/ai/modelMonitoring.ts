/**
 * AI Model Monitoring
 * 
 * Track model performance, detect drift, and ensure model quality over time.
 */

export interface ModelPrediction {
  loanId: string;
  predictedScore: number;
  predictedDefaultProbability: number;
  actualOutcome?: 'repaid' | 'defaulted' | 'active';
  timestamp: Date;
  features: Record<string, any>;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  aucRoc: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  truePositiveRate: number;
  trueNegativeRate: number;
}

export interface CalibrationMetrics {
  expectedCalibrationError: number; // ECE
  maximumCalibrationError: number; // MCE
  binAccuracies: number[];
  binCounts: number[];
}

export interface DriftMetrics {
  psiScore: number; // Population Stability Index
  isSignificantDrift: boolean;
  driftThreshold: number;
  affectedFeatures: string[];
}

/**
 * Calculate model performance metrics
 */
export function calculateModelMetrics(
  predictions: ModelPrediction[]
): ModelMetrics {
  const completed = predictions.filter(
    (p) => p.actualOutcome === 'repaid' || p.actualOutcome === 'defaulted'
  );

  if (completed.length === 0) {
    return {
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      aucRoc: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      truePositiveRate: 0,
      trueNegativeRate: 0,
    };
  }

  // Use 0.5 probability threshold for binary classification
  const threshold = 0.5;

  let truePositives = 0; // Predicted repay, actually repaid
  let trueNegatives = 0; // Predicted default, actually defaulted
  let falsePositives = 0; // Predicted repay, actually defaulted
  let falseNegatives = 0; // Predicted default, actually repaid

  completed.forEach((p) => {
    const predictedRepay = p.predictedDefaultProbability < threshold;
    const actuallyRepaid = p.actualOutcome === 'repaid';

    if (predictedRepay && actuallyRepaid) truePositives++;
    else if (!predictedRepay && !actuallyRepaid) trueNegatives++;
    else if (predictedRepay && !actuallyRepaid) falsePositives++;
    else if (!predictedRepay && actuallyRepaid) falseNegatives++;
  });

  const accuracy = (truePositives + trueNegatives) / completed.length;
  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;
  const f1Score = (2 * precision * recall) / (precision + recall) || 0;

  const fpr = falsePositives / (falsePositives + trueNegatives) || 0;
  const fnr = falseNegatives / (falseNegatives + truePositives) || 0;
  const tpr = recall; // Same as recall
  const tnr = trueNegatives / (trueNegatives + falsePositives) || 0;

  // Calculate AUC-ROC
  const aucRoc = calculateAUCROC(completed);

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    aucRoc,
    falsePositiveRate: fpr,
    falseNegativeRate: fnr,
    truePositiveRate: tpr,
    trueNegativeRate: tnr,
  };
}

/**
 * Calculate AUC-ROC (Area Under Receiver Operating Characteristic Curve)
 */
function calculateAUCROC(predictions: ModelPrediction[]): number {
  // Sort by predicted probability
  const sorted = [...predictions].sort(
    (a, b) => b.predictedDefaultProbability - a.predictedDefaultProbability
  );

  let truePositiveCount = 0;
  let falsePositiveCount = 0;
  let truePositiveSum = 0;

  const positiveCount = sorted.filter((p) => p.actualOutcome === 'repaid').length;
  const negativeCount = sorted.length - positiveCount;

  if (positiveCount === 0 || negativeCount === 0) {
    return 0.5; // Random classifier
  }

  sorted.forEach((p) => {
    if (p.actualOutcome === 'defaulted') {
      falsePositiveCount++;
      truePositiveSum += truePositiveCount;
    } else {
      truePositiveCount++;
    }
  });

  return truePositiveSum / (positiveCount * negativeCount);
}

/**
 * Calculate calibration metrics
 * Checks if predicted probabilities match actual outcomes
 */
export function calculateCalibration(
  predictions: ModelPrediction[],
  numBins: number = 10
): CalibrationMetrics {
  const completed = predictions.filter(
    (p) => p.actualOutcome === 'repaid' || p.actualOutcome === 'defaulted'
  );

  const bins: ModelPrediction[][] = Array.from({ length: numBins }, () => []);

  // Assign predictions to bins
  completed.forEach((p) => {
    const binIndex = Math.min(
      Math.floor(p.predictedDefaultProbability * numBins),
      numBins - 1
    );
    bins[binIndex].push(p);
  });

  const binAccuracies: number[] = [];
  const binCounts: number[] = [];
  let ece = 0; // Expected Calibration Error
  let mce = 0; // Maximum Calibration Error

  bins.forEach((bin, index) => {
    if (bin.length === 0) {
      binAccuracies.push(0);
      binCounts.push(0);
      return;
    }

    const binProbability = (index + 0.5) / numBins;
    const actualRepayRate =
      bin.filter((p) => p.actualOutcome === 'repaid').length / bin.length;
    const calibrationError = Math.abs(binProbability - actualRepayRate);

    binAccuracies.push(actualRepayRate);
    binCounts.push(bin.length);

    // ECE: Weighted average of calibration errors
    ece += (bin.length / completed.length) * calibrationError;

    // MCE: Maximum calibration error across bins
    mce = Math.max(mce, calibrationError);
  });

  return {
    expectedCalibrationError: ece,
    maximumCalibrationError: mce,
    binAccuracies,
    binCounts,
  };
}

/**
 * Detect model drift using Population Stability Index (PSI)
 */
export function detectDrift(
  referencePredictions: ModelPrediction[],
  currentPredictions: ModelPrediction[],
  numBins: number = 10,
  threshold: number = 0.2
): DriftMetrics {
  // Calculate PSI for predicted probabilities
  const psi = calculatePSI(
    referencePredictions.map((p) => p.predictedDefaultProbability),
    currentPredictions.map((p) => p.predictedDefaultProbability),
    numBins
  );

  // Check drift in individual features
  const affectedFeatures: string[] = [];
  const featureNames = Object.keys(referencePredictions[0]?.features || {});

  featureNames.forEach((feature) => {
    const refValues = referencePredictions.map((p) => p.features[feature]).filter((v) => v != null);
    const currValues = currentPredictions.map((p) => p.features[feature]).filter((v) => v != null);

    if (refValues.length > 0 && currValues.length > 0) {
      const featurePSI = calculatePSI(refValues, currValues, numBins);
      if (featurePSI > threshold) {
        affectedFeatures.push(feature);
      }
    }
  });

  return {
    psiScore: psi,
    isSignificantDrift: psi > threshold,
    driftThreshold: threshold,
    affectedFeatures,
  };
}

/**
 * Calculate Population Stability Index (PSI)
 * PSI < 0.1: No significant change
 * 0.1 <= PSI < 0.2: Moderate change
 * PSI >= 0.2: Significant change (potential drift)
 */
function calculatePSI(
  reference: number[],
  current: number[],
  numBins: number = 10
): number {
  const refBins = createBins(reference, numBins);
  const currBins = createBins(current, numBins);

  let psi = 0;

  for (let i = 0; i < numBins; i++) {
    const refPct = refBins[i] / reference.length || 0.0001;
    const currPct = currBins[i] / current.length || 0.0001;
    psi += (currPct - refPct) * Math.log(currPct / refPct);
  }

  return psi;
}

/**
 * Create bins for PSI calculation
 */
function createBins(values: number[], numBins: number): number[] {
  const bins = Array(numBins).fill(0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const binSize = (max - min) / numBins;

  values.forEach((value) => {
    const binIndex = Math.min(
      Math.floor((value - min) / binSize),
      numBins - 1
    );
    bins[binIndex]++;
  });

  return bins;
}

/**
 * Calculate feature importance drift
 */
export function calculateFeatureImportanceDrift(
  referenceImportance: Record<string, number>,
  currentImportance: Record<string, number>
): Record<string, number> {
  const drift: Record<string, number> = {};

  Object.keys(referenceImportance).forEach((feature) => {
    const refValue = referenceImportance[feature];
    const currValue = currentImportance[feature] || 0;
    drift[feature] = Math.abs(currValue - refValue);
  });

  return drift;
}

/**
 * Generate model monitoring report
 */
export function generateMonitoringReport(
  predictions: ModelPrediction[],
  referencePredictions: ModelPrediction[]
): {
  metrics: ModelMetrics;
  calibration: CalibrationMetrics;
  drift: DriftMetrics;
  summary: string;
  alerts: string[];
} {
  const metrics = calculateModelMetrics(predictions);
  const calibration = calculateCalibration(predictions);
  const drift = detectDrift(referencePredictions, predictions);

  const alerts: string[] = [];

  // Check for performance degradation
  if (metrics.accuracy < 0.7) {
    alerts.push('⚠️ Model accuracy below 70%');
  }
  if (metrics.f1Score < 0.6) {
    alerts.push('⚠️ F1 score below 60%');
  }

  // Check calibration
  if (calibration.expectedCalibrationError > 0.1) {
    alerts.push('⚠️ Model is poorly calibrated (ECE > 0.1)');
  }

  // Check drift
  if (drift.isSignificantDrift) {
    alerts.push(`🚨 Significant model drift detected (PSI: ${drift.psiScore.toFixed(3)})`);
  }
  if (drift.affectedFeatures.length > 0) {
    alerts.push(
      `⚠️ Feature drift in: ${drift.affectedFeatures.join(', ')}`
    );
  }

  // Generate summary
  let summary = `Model Performance Report\n`;
  summary += `Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%\n`;
  summary += `Precision: ${(metrics.precision * 100).toFixed(1)}%\n`;
  summary += `Recall: ${(metrics.recall * 100).toFixed(1)}%\n`;
  summary += `F1 Score: ${(metrics.f1Score * 100).toFixed(1)}%\n`;
  summary += `AUC-ROC: ${(metrics.aucRoc * 100).toFixed(1)}%\n`;
  summary += `\nCalibration ECE: ${calibration.expectedCalibrationError.toFixed(3)}\n`;
  summary += `Drift PSI: ${drift.psiScore.toFixed(3)}\n`;

  if (alerts.length > 0) {
    summary += `\n⚠️ ${alerts.length} alert(s) detected`;
  } else {
    summary += `\n✅ Model performing well`;
  }

  return {
    metrics,
    calibration,
    drift,
    summary,
    alerts,
  };
}
