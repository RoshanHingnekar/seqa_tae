export interface EstimationInput {
  projectName?: string;
  projectType?: string;
  loc: number;
  testCases: number;
  coverage: number;
  automationPercent?: number;
  complexity?: 'Low' | 'Medium' | 'High' | string;
  environments?: number;
  apiCount?: number;
  hasMobileAndWeb?: boolean;
  hasExternalIntegrations?: boolean;
  hasSecurityCompliance?: boolean;
  customLocRate?: number;
  customTestCaseRate?: number;
}

export interface EstimationResult {
  projectName: string;
  projectType: string;
  loc: number;
  testCases: number;
  coverage: number;
  automationPercent: number;
  complexity: 'Low' | 'Medium' | 'High';
  environments: number;
  apiCount: number;
  
  locRate: number;
  testCaseRate: number;
  locEffort: number;
  testCaseEffort: number;
  baseEffort: number;
  coverageMultiplier: number;
  complexityMultiplier: number;
  envMultiplier: number;
  
  totalHours: number;
  personDays: number;
  personWeeks: number;
  
  recommendedTeam: {
    qaLead: number;
    qaEngineers: number;
    automationEngineers: number;
    totalTeamSize: number;
    notes: string;
  };
  
  breakdown: {
    manualTestingHours: number;
    manualTestingPercent: number;
    automationHours: number;
    automationPercent: number;
    defectRetestingHours: number;
    defectRetestingPercent: number;
    testPlanningHours: number;
    testPlanningPercent: number;
    reportingHours: number;
    reportingPercent: number;
  };
  
  complexityFactors: {
    factor: string;
    level: string;
    impact: string;
  }[];
  
  parameterTable: {
    parameter: string;
    input: string;
    weightage: string;
    estimatedEffort: string;
  }[];
  
  trendCurve: {
    locLabel: string;
    locValue: number;
    hours: number;
    previousEstimateHours: number;
  }[];
  
  disclaimer: string;
}

// Configurable constants
export const DEFAULT_CONFIG = {
  LOC_RATE: 6.4, // Hours per 1,000 LOC
  TEST_CASE_RATE: 0.1242, // Hours per test case
  BASELINE_COVERAGE: 70.0,
  COMPLEXITY_MULTIPLIERS: {
    Low: 0.85,
    Medium: 1.00,
    High: 1.25,
  },
  ENV_MULTIPLIERS: {
    1: 1.00,
    2: 1.10,
    3: 1.20,
  },
  WORKING_HOURS_PER_DAY: 8.0,
  WORKING_HOURS_PER_WEEK: 40.0,
};

export function calculateQAEstimate(
  input: EstimationInput,
  config = DEFAULT_CONFIG
): EstimationResult {
  const loc = Math.max(0, Number(input.loc) || 0);
  const testCases = Math.max(0, Number(input.testCases) || 0);
  const coverage = Math.min(100, Math.max(0, Number(input.coverage) || 70));
  const automationPercent = Math.min(100, Math.max(0, Number(input.automationPercent ?? 30)));
  const environments = Math.max(1, Number(input.environments) || 1);
  const apiCount = Math.max(0, Number(input.apiCount) || 0);
  const projectName = input.projectName?.trim() || 'Untitled QA Project';
  const projectType = input.projectType || 'Full Stack Application';

  // Determine Complexity
  let detectedComplexity: 'Low' | 'Medium' | 'High' = 'Medium';
  if (input.complexity && ['Low', 'Medium', 'High'].includes(input.complexity)) {
    detectedComplexity = input.complexity as 'Low' | 'Medium' | 'High';
  } else {
    let score = 0;
    if (loc > 20000) score += 2;
    else if (loc > 8000) score += 1;
    if (testCases > 500) score += 2;
    else if (testCases > 200) score += 1;
    if (environments > 2) score += 1;
    if (apiCount > 15) score += 2;
    else if (apiCount > 5) score += 1;
    if (input.hasMobileAndWeb) score += 1;
    if (input.hasExternalIntegrations) score += 1;
    if (input.hasSecurityCompliance) score += 1;

    if (score <= 2) detectedComplexity = 'Low';
    else if (score <= 5) detectedComplexity = 'Medium';
    else detectedComplexity = 'High';
  }

  const locRate = input.customLocRate ?? config.LOC_RATE;
  const testCaseRate = input.customTestCaseRate ?? config.TEST_CASE_RATE;

  // 1. Base Effort
  const locEffort = (loc / 1000) * locRate;
  const testCaseEffort = testCases * testCaseRate;
  const baseEffort = locEffort + testCaseEffort;

  // 2. Coverage Multiplier
  // 1 + ((Coverage - 70) / 100)
  const coverageMultiplier = Math.max(0.3, 1 + (coverage - config.BASELINE_COVERAGE) / 100);

  // 3. Complexity Multiplier
  const complexityMultiplier = config.COMPLEXITY_MULTIPLIERS[detectedComplexity] || 1.0;

  // 4. Environment Multiplier
  const envMultiplier =
    environments === 1
      ? config.ENV_MULTIPLIERS[1]
      : environments === 2
      ? config.ENV_MULTIPLIERS[2]
      : config.ENV_MULTIPLIERS[3];

  // 5. Raw Total Hours before rounding
  const rawTotalHours = baseEffort * coverageMultiplier * complexityMultiplier * envMultiplier;
  const totalHours = Math.round(rawTotalHours * 10) / 10;
  const personDays = Math.round((totalHours / config.WORKING_HOURS_PER_DAY) * 10) / 10;
  const personWeeks = Math.round((totalHours / config.WORKING_HOURS_PER_WEEK) * 10) / 10;

  // 6. Dynamic Effort Breakdown based on automation ratio
  // Standard baseline: Manual 42%, Automation 28%, Defect Retest 15%, Planning 10%, Reporting 5%
  // Adjust based on automation percentage
  const autoRatio = automationPercent / 100;
  const manualTestingPercent = Math.max(15, Math.round(56 - autoRatio * 35));
  const automationEffortPercent = Math.max(10, Math.round(15 + autoRatio * 30));
  const defectRetestingPercent = 15;
  const testPlanningPercent = 10;
  const reportingPercent = Math.max(5, 100 - (manualTestingPercent + automationEffortPercent + defectRetestingPercent + testPlanningPercent));

  const manualTestingHours = Math.round(totalHours * (manualTestingPercent / 100) * 10) / 10;
  const automationHours = Math.round(totalHours * (automationEffortPercent / 100) * 10) / 10;
  const defectRetestingHours = Math.round(totalHours * (defectRetestingPercent / 100) * 10) / 10;
  const testPlanningHours = Math.round(totalHours * (testPlanningPercent / 100) * 10) / 10;
  const reportingHours = Math.round((totalHours - (manualTestingHours + automationHours + defectRetestingHours + testPlanningHours)) * 10) / 10;

  // 7. Recommended QA Team
  let qaLead = 1;
  let qaEngineers = 1;
  let automationEngineers = 1;

  if (totalHours < 80) {
    qaEngineers = 1;
    automationEngineers = automationPercent > 30 ? 1 : 0;
  } else if (totalHours <= 180) {
    qaEngineers = 2;
    automationEngineers = 1;
  } else if (totalHours <= 300) {
    qaEngineers = 3;
    automationEngineers = 2;
  } else {
    qaLead = Math.ceil(totalHours / 250);
    qaEngineers = Math.ceil(totalHours / 80);
    automationEngineers = Math.ceil((totalHours * (automationPercent / 100)) / 60);
  }
  const totalTeamSize = qaLead + qaEngineers + automationEngineers;

  // 8. Dynamic Complexity Factor checklist
  const complexityFactors = [
    {
      factor: 'Web + Mobile Applications',
      level: projectType.includes('Mobile') || projectType.includes('Full Stack') ? 'Enabled' : 'Disabled',
      impact: projectType.includes('Mobile') ? '+15% multi-platform test matrices' : 'Standard single browser/platform',
    },
    {
      factor: 'Business Logic Complexity',
      level: detectedComplexity,
      impact: detectedComplexity === 'High' ? 'Deep transactional branching & edge cases' : 'Standard CRUD workflow flows',
    },
    {
      factor: 'External Integrations',
      level: apiCount > 10 ? 'High' : apiCount > 3 ? 'Medium' : 'Low',
      impact: `${apiCount} active REST/gRPC endpoints & webhook flows`,
    },
    {
      factor: 'Multiple Environments',
      level: `${environments} Deployment Env(s)`,
      impact: environments > 1 ? `x${envMultiplier} cross-environment smoke & regression` : 'Single staging test environment',
    },
    {
      factor: 'Target Coverage Requirement',
      level: `${coverage}% Target`,
      impact: coverage >= 80 ? `x${coverageMultiplier.toFixed(2)} comprehensive branch & unit verification` : 'Baseline sanity validation',
    },
    {
      factor: 'Automation Level',
      level: `${automationPercent}% Target`,
      impact: `${automationPercent}% script maintenance with CI/CD pipeline runs`,
    },
  ];

  // 9. Detailed Parameter Table
  const parameterTable = [
    {
      parameter: 'Lines of Code (LOC)',
      input: `${loc.toLocaleString()} LOC`,
      weightage: `${locRate} hrs / 1,000 LOC`,
      estimatedEffort: `${Math.round(locEffort * 10) / 10} hours`,
    },
    {
      parameter: 'Test Case Count',
      input: `${testCases.toLocaleString()} Test Cases`,
      weightage: `${testCaseRate} hrs / Test Case`,
      estimatedEffort: `${Math.round(testCaseEffort * 10) / 10} hours`,
    },
    {
      parameter: 'Target Coverage',
      input: `${coverage}%`,
      weightage: `Multiplier: ${coverageMultiplier.toFixed(2)}x (Base 70%)`,
      estimatedEffort: `+${Math.round((coverageMultiplier - 1) * baseEffort * 10) / 10} hours factor`,
    },
    {
      parameter: 'Project Complexity',
      input: `${detectedComplexity}`,
      weightage: `Multiplier: ${complexityMultiplier.toFixed(2)}x`,
      estimatedEffort: `${complexityMultiplier === 1 ? 'Neutral' : (complexityMultiplier > 1 ? '+' : '-') + Math.abs(Math.round((complexityMultiplier - 1) * baseEffort * 10) / 10) + ' hours'}`,
    },
    {
      parameter: 'Target Environments',
      input: `${environments} Environment(s)`,
      weightage: `Multiplier: ${envMultiplier.toFixed(2)}x`,
      estimatedEffort: `${envMultiplier === 1 ? 'Neutral' : '+' + Math.round((envMultiplier - 1) * baseEffort * 10) / 10 + ' hours'}`,
    },
  ];

  // 10. Estimation Trend Curve (LOC vs QA hours curve)
  const steps = [1000, 5000, 10000, 20000, 30000];
  const trendCurve = steps.map((stepLoc) => {
    const stepEffort = (stepLoc / 1000) * locRate + (testCases * (stepLoc / (loc || 10000))) * testCaseRate;
    const hrs = Math.round(stepEffort * coverageMultiplier * complexityMultiplier * envMultiplier);
    return {
      locLabel: `${stepLoc / 1000}K LOC`,
      locValue: stepLoc,
      hours: hrs,
      previousEstimateHours: Math.round(hrs * 0.92),
    };
  });

  return {
    projectName,
    projectType,
    loc,
    testCases,
    coverage,
    automationPercent,
    complexity: detectedComplexity,
    environments,
    apiCount,
    locRate,
    testCaseRate,
    locEffort: Math.round(locEffort * 10) / 10,
    testCaseEffort: Math.round(testCaseEffort * 10) / 10,
    baseEffort: Math.round(baseEffort * 10) / 10,
    coverageMultiplier: Math.round(coverageMultiplier * 100) / 100,
    complexityMultiplier,
    envMultiplier,
    totalHours,
    personDays,
    personWeeks,
    recommendedTeam: {
      qaLead,
      qaEngineers,
      automationEngineers,
      totalTeamSize,
      notes: `${qaLead} QA Lead, ${qaEngineers} QA Engineers, ${automationEngineers} Automation Engineer (${totalTeamSize} specialists)`,
    },
    breakdown: {
      manualTestingHours,
      manualTestingPercent,
      automationHours,
      automationPercent: automationEffortPercent,
      defectRetestingHours,
      defectRetestingPercent,
      testPlanningHours,
      testPlanningPercent,
      reportingHours,
      reportingPercent,
    },
    complexityFactors,
    parameterTable,
    trendCurve,
    disclaimer: 'Estimate based on configurable assumptions and historical/project factors.',
  };
}
