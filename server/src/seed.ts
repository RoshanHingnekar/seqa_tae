import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';
import { calculateQAEstimate } from './services/calculator.js';

async function main() {
  console.log('Seeding QAEstimator Pro database...');

  // 1. Clear existing data
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.estimation.deleteMany();
  await prisma.estimationHistory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. Global System Settings
  await prisma.systemSetting.create({
    data: {
      id: 'global-config',
      locRate: 6.4,
      testCaseRate: 0.1242,
      baselineCoverage: 70.0,
      lowMultiplier: 0.85,
      medMultiplier: 1.00,
      highMultiplier: 1.25,
      env1Multiplier: 1.00,
      env2Multiplier: 1.10,
      env3Multiplier: 1.20,
      workingHoursPerDay: 8.0,
      workingDaysPerWeek: 5.0,
    },
  });

  // 3. Create Demo User (Ramesh Kumar)
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const demoUser = await prisma.user.create({
    data: {
      email: 'ramesh@qaestimator.io',
      password: passwordHash,
      name: 'Ramesh Kumar',
      role: 'QA Lead',
      phone: '+1 (555) 382-9410',
      organization: 'Enterprise QA Solutions Ltd.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log(`Created demo user: ${demoUser.email} (Password: password123)`);

  // 4. Create Primary Demo Project: "E-Commerce Full Stack Platform"
  const primaryCalc = calculateQAEstimate({
    projectName: 'E-Commerce Full Stack Platform',
    projectType: 'Full Stack Application',
    loc: 12500,
    testCases: 420,
    coverage: 85.0,
    automationPercent: 35.0,
    complexity: 'Medium',
    environments: 1,
    apiCount: 14,
  });

  const primaryProject = await prisma.project.create({
    data: {
      userId: demoUser.id,
      name: primaryCalc.projectName,
      type: primaryCalc.projectType,
      loc: primaryCalc.loc,
      testCases: primaryCalc.testCases,
      coverage: primaryCalc.coverage,
      automationPercent: primaryCalc.automationPercent,
      complexity: primaryCalc.complexity,
      environments: primaryCalc.environments,
      apiCount: primaryCalc.apiCount,
      estimatedHours: primaryCalc.totalHours, // 152.0
      personDays: primaryCalc.personDays,     // 19.0
      personWeeks: primaryCalc.personWeeks,   // 3.8
      status: 'Active',
      description: 'End-to-end B2C and B2B eCommerce web & mobile commerce platform with multi-currency cart, Stripe/PayPal checkout, and inventory tracking.',
    },
  });

  // Estimation record
  await prisma.estimation.create({
    data: {
      projectId: primaryProject.id,
      projectName: primaryProject.name,
      loc: primaryProject.loc,
      testCases: primaryProject.testCases,
      coverage: primaryProject.coverage,
      automationPercent: primaryProject.automationPercent,
      complexity: primaryProject.complexity,
      environments: primaryProject.environments,
      apiCount: primaryProject.apiCount,
      locEffort: primaryCalc.locEffort,
      testCaseEffort: primaryCalc.testCaseEffort,
      coverageMultiplier: primaryCalc.coverageMultiplier,
      complexityMultiplier: primaryCalc.complexityMultiplier,
      envMultiplier: primaryCalc.envMultiplier,
      totalHours: primaryCalc.totalHours,
      personDays: primaryCalc.personDays,
      personWeeks: primaryCalc.personWeeks,
      recommendedTeam: JSON.stringify(primaryCalc.recommendedTeam),
      breakdown: JSON.stringify(primaryCalc.breakdown),
      notes: 'Standard enterprise estimate baseline with 85% coverage and 1 staging environment.',
    },
  });

  // Additional realistic projects
  const additionalProjects = [
    {
      name: 'FinTech NeoBank Payment Gateway',
      type: 'Enterprise Application',
      loc: 28000,
      testCases: 850,
      coverage: 92.0,
      automationPercent: 55.0,
      complexity: 'High',
      environments: 3,
      apiCount: 26,
      status: 'In Review',
      description: 'PCI-DSS Tier-1 compliant transaction authorization core and ledger ledger processing engine.',
    },
    {
      name: 'Healthcare Patient EHR Mobile App',
      type: 'Mobile Application',
      loc: 8400,
      testCases: 310,
      coverage: 88.0,
      automationPercent: 25.0,
      complexity: 'Medium',
      environments: 2,
      apiCount: 10,
      status: 'Active',
      description: 'HIPAA compliant tele-health scheduling and electronic health record viewing for iOS and Android.',
    },
    {
      name: 'Cloud Logistics Dispatch API',
      type: 'API',
      loc: 16200,
      testCases: 540,
      coverage: 80.0,
      automationPercent: 40.0,
      complexity: 'Medium',
      environments: 2,
      apiCount: 18,
      status: 'Planning',
      description: 'High-throughput GPS routing, fleet telematics tracking, and warehouse dispatch message broker.',
    },
    {
      name: 'SaaS Identity & SSO Microservice',
      type: 'Web Application',
      loc: 4800,
      testCases: 190,
      coverage: 95.0,
      automationPercent: 60.0,
      complexity: 'High',
      environments: 1,
      apiCount: 8,
      status: 'Completed',
      description: 'OAuth2.0 / SAML 2.0 multi-tenant authentication microservice with Passkeys and WebAuthn.',
    },
  ];

  for (const p of additionalProjects) {
    const calc = calculateQAEstimate(p);
    const createdP = await prisma.project.create({
      data: {
        userId: demoUser.id,
        name: p.name,
        type: p.type,
        loc: p.loc,
        testCases: p.testCases,
        coverage: p.coverage,
        automationPercent: p.automationPercent,
        complexity: p.complexity,
        environments: p.environments,
        apiCount: p.apiCount,
        estimatedHours: calc.totalHours,
        personDays: calc.personDays,
        personWeeks: calc.personWeeks,
        status: p.status,
        description: p.description,
      },
    });

    await prisma.estimation.create({
      data: {
        projectId: createdP.id,
        projectName: createdP.name,
        loc: createdP.loc,
        testCases: createdP.testCases,
        coverage: createdP.coverage,
        automationPercent: createdP.automationPercent,
        complexity: createdP.complexity,
        environments: createdP.environments,
        apiCount: createdP.apiCount,
        locEffort: calc.locEffort,
        testCaseEffort: calc.testCaseEffort,
        coverageMultiplier: calc.coverageMultiplier,
        complexityMultiplier: calc.complexityMultiplier,
        envMultiplier: calc.envMultiplier,
        totalHours: calc.totalHours,
        personDays: calc.personDays,
        personWeeks: calc.personWeeks,
        recommendedTeam: JSON.stringify(calc.recommendedTeam),
        breakdown: JSON.stringify(calc.breakdown),
      },
    });

    // History record
    await prisma.estimationHistory.create({
      data: {
        projectId: createdP.id,
        projectName: createdP.name,
        loc: createdP.loc,
        testCases: createdP.testCases,
        coverage: createdP.coverage,
        complexity: createdP.complexity,
        environments: createdP.environments,
        estimatedHours: calc.totalHours,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 + 2) * 86400000),
      },
    });
  }

  // Primary project history record
  await prisma.estimationHistory.create({
    data: {
      projectId: primaryProject.id,
      projectName: primaryProject.name,
      loc: primaryProject.loc,
      testCases: primaryProject.testCases,
      coverage: primaryProject.coverage,
      complexity: primaryProject.complexity,
      environments: primaryProject.environments,
      estimatedHours: primaryCalc.totalHours,
    },
  });

  // 5. Test Cases for Primary Project
  const testCasesData = [
    { testId: 'TC-101', title: 'Verify user authentication with valid OAuth credentials', module: 'Auth', priority: 'P1', type: 'Automated', status: 'Passed', assignedTo: 'Sarah Jenkins' },
    { testId: 'TC-102', title: 'Validate password complexity enforcement rules', module: 'Auth', priority: 'P2', type: 'Automated', status: 'Passed', assignedTo: 'Sarah Jenkins' },
    { testId: 'TC-103', title: 'Session timeout after 15 minutes of inactivity', module: 'Auth', priority: 'P2', type: 'Manual', status: 'Passed', assignedTo: 'Elena Rostova' },
    { testId: 'TC-104', title: 'Stripe 3D-Secure 2.0 card payment checkout flow', module: 'Checkout', priority: 'P1', type: 'Automated', status: 'Passed', assignedTo: 'Alex Chen' },
    { testId: 'TC-105', title: 'Simulate declined transaction with insufficient funds', module: 'Checkout', priority: 'P1', type: 'Automated', status: 'Passed', assignedTo: 'Alex Chen' },
    { testId: 'TC-106', title: 'Cart price recalculation on coupon code application', module: 'Checkout', priority: 'P2', type: 'Manual', status: 'Passed', assignedTo: 'Priya Patel' },
    { testId: 'TC-107', title: 'Multi-currency conversion rounding accuracy', module: 'Checkout', priority: 'P2', type: 'Manual', status: 'Failed', assignedTo: 'Priya Patel' },
    { testId: 'TC-108', title: 'Product catalog full-text search with typo tolerance', module: 'Catalog', priority: 'P3', type: 'Automated', status: 'Passed', assignedTo: 'Alex Chen' },
    { testId: 'TC-109', title: 'Faceted filtering by category, price, and rating', module: 'Catalog', priority: 'P2', type: 'Automated', status: 'Passed', assignedTo: 'Sarah Jenkins' },
    { testId: 'TC-110', title: 'Out of stock inventory badge & add-to-cart disable', module: 'Catalog', priority: 'P2', type: 'Manual', status: 'Passed', assignedTo: 'Elena Rostova' },
    { testId: 'TC-111', title: 'REST API rate limiting returns HTTP 429 after 100 req/min', module: 'API', priority: 'P1', type: 'Automated', status: 'Passed', assignedTo: 'Marcus Brody' },
    { testId: 'TC-112', title: 'Payload validation with invalid JSON schema schema', module: 'API', priority: 'P2', type: 'Automated', status: 'Passed', assignedTo: 'Marcus Brody' },
    { testId: 'TC-113', title: 'Webhook callback retry with exponential backoff', module: 'API', priority: 'P1', type: 'Automated', status: 'Blocked', assignedTo: 'Alex Chen' },
    { testId: 'TC-114', title: 'PDF Invoice generation format and tax computation', module: 'Reporting', priority: 'P3', type: 'Manual', status: 'Not Run', assignedTo: 'Elena Rostova' },
    { testId: 'TC-115', title: 'GDPR Data export request and zip bundle generation', module: 'Security', priority: 'P1', type: 'Manual', status: 'Passed', assignedTo: 'Ramesh Kumar' },
    { testId: 'TC-116', title: 'Cross-Site Scripting (XSS) in review input field', module: 'Security', priority: 'P1', type: 'Manual', status: 'Passed', assignedTo: 'Ramesh Kumar' },
    { testId: 'TC-117', title: 'Mobile viewport responsive checkout drawer on iOS Safari', module: 'Checkout', priority: 'P2', type: 'Manual', status: 'Not Run', assignedTo: 'Priya Patel' },
    { testId: 'TC-118', title: 'Order confirmation email dispatch via SendGrid webhook', module: 'Checkout', priority: 'P2', type: 'Automated', status: 'Passed', assignedTo: 'Sarah Jenkins' },
  ];

  for (const tc of testCasesData) {
    await prisma.testCase.create({
      data: {
        projectId: primaryProject.id,
        testId: tc.testId,
        title: tc.title,
        module: tc.module,
        priority: tc.priority,
        type: tc.type,
        status: tc.status,
        assignedTo: tc.assignedTo,
      },
    });
  }

  // 6. QA Team Members
  const teamMembers = [
    {
      name: 'Ramesh Kumar',
      role: 'QA Lead',
      experience: '8+ Years',
      availability: 'Available',
      capacity: 95,
      email: 'ramesh.lead@qaestimator.io',
      phone: '+1 (555) 382-9410',
      assignedProjects: 'E-Commerce Full Stack Platform, FinTech NeoBank',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sarah Jenkins',
      role: 'Senior QA Engineer',
      experience: '5+ Years',
      availability: 'Available',
      capacity: 85,
      email: 'sarah.j@qaestimator.io',
      phone: '+1 (555) 441-2910',
      assignedProjects: 'E-Commerce Full Stack Platform, Healthcare EHR',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Alex Chen',
      role: 'Automation Architect',
      experience: '6+ Years',
      availability: 'Busy',
      capacity: 100,
      email: 'alex.c@qaestimator.io',
      phone: '+1 (555) 782-1134',
      assignedProjects: 'E-Commerce Full Stack Platform, FinTech NeoBank',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Priya Patel',
      role: 'QA Engineer',
      experience: '3+ Years',
      availability: 'Available',
      capacity: 80,
      email: 'priya.p@qaestimator.io',
      phone: '+1 (555) 902-8812',
      assignedProjects: 'E-Commerce Full Stack Platform',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Marcus Brody',
      role: 'Automation Engineer',
      experience: '4+ Years',
      availability: 'Available',
      capacity: 75,
      email: 'marcus.b@qaestimator.io',
      phone: '+1 (555) 671-0023',
      assignedProjects: 'Cloud Logistics Dispatch API, E-Commerce Platform',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Elena Rostova',
      role: 'Manual Tester',
      experience: '2+ Years',
      availability: 'Available',
      capacity: 90,
      email: 'elena.r@qaestimator.io',
      phone: '+1 (555) 334-9981',
      assignedProjects: 'E-Commerce Full Stack Platform, SaaS Identity',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    },
  ];

  for (const m of teamMembers) {
    await prisma.teamMember.create({ data: m });
  }

  // 7. Seed Reports
  await prisma.report.create({
    data: {
      projectId: primaryProject.id,
      reportType: 'Estimation Report',
      title: 'Q3 Enterprise QA Resource Assessment',
      summary: 'Detailed estimation breakdown indicating 152 person-hours needed across 19 business days for E-Commerce platform sign-off.',
      data: JSON.stringify({
        project: primaryProject.name,
        hours: 152,
        days: 19,
        teamSize: 4,
        confidence: '95%',
        assumptions: 'Based on 12.5k LOC, 420 test cases, 85% branch coverage.',
      }),
    },
  });

  await prisma.report.create({
    data: {
      projectId: primaryProject.id,
      reportType: 'Test Coverage Report',
      title: 'Sprint 24 Coverage & Automation Matrix',
      summary: 'Current test suite coverage is 85% with 35% automated in Playwright/Cypress.',
      data: JSON.stringify({
        coverage: '85%',
        automatedCases: 147,
        manualCases: 273,
        criticalPassRate: '98.5%',
      }),
    },
  });

  // 8. Seed Notifications
  const notificationsData = [
    {
      userId: demoUser.id,
      title: 'Estimation Recalculation Completed',
      message: 'E-Commerce Full Stack Platform estimate refreshed: 152 QA person-hours.',
      type: 'success',
      isRead: false,
    },
    {
      userId: demoUser.id,
      title: 'Regression Run Alert',
      message: '1 test case (TC-107) failed during multi-currency checkout verification.',
      type: 'warning',
      isRead: false,
    },
    {
      userId: demoUser.id,
      title: 'Team Allocation Notice',
      message: 'Alex Chen reached 100% capacity across 2 active projects.',
      type: 'info',
      isRead: true,
    },
    {
      userId: demoUser.id,
      title: 'New Test Report Ready',
      message: 'Q3 Enterprise QA Resource Assessment has been generated and ready for export.',
      type: 'info',
      isRead: true,
    },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }

  console.log('Database seeded successfully with all required demo data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
