export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  organization?: string;
  avatar?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  type: string;
  loc: number;
  testCases: number;
  coverage: number;
  automationPercent: number;
  complexity: 'Low' | 'Medium' | 'High' | string;
  environments: number;
  apiCount: number;
  estimatedHours: number;
  personDays: number;
  personWeeks: number;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    testCaseItems?: number;
    reports?: number;
    history?: number;
  };
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

export interface TestCase {
  id: string;
  projectId: string;
  testId: string;
  title: string;
  module: string;
  priority: 'P1' | 'P2' | 'P3' | string;
  type: 'Manual' | 'Automated' | 'Regression' | string;
  status: 'Passed' | 'Failed' | 'Blocked' | 'Not Run' | string;
  assignedTo?: string;
  steps?: string;
  createdAt: string;
  project?: {
    name: string;
  };
}

export interface TestCaseStats {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  automated: number;
  automationCoverage: number;
  passRate: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  availability: 'Available' | 'Busy' | 'On Leave' | string;
  capacity: number;
  email: string;
  phone?: string;
  assignedProjects?: string;
  avatar?: string;
}

export interface ReportItem {
  id: string;
  projectId: string;
  reportType: string;
  title: string;
  summary: string;
  data: string;
  createdAt: string;
  project?: {
    name: string;
    type: string;
    estimatedHours: number;
  };
}

export interface EstimationHistoryItem {
  id: string;
  projectId?: string;
  projectName: string;
  loc: number;
  testCases: number;
  coverage: number;
  complexity: string;
  environments: number;
  estimatedHours: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | string;
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
  id: string;
  locRate: number;
  testCaseRate: number;
  baselineCoverage: number;
  lowMultiplier: number;
  medMultiplier: number;
  highMultiplier: number;
  env1Multiplier: number;
  env2Multiplier: number;
  env3Multiplier: number;
  workingHoursPerDay: number;
  workingDaysPerWeek: number;
}
