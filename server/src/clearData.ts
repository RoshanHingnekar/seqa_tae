import { prisma } from './prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Clearing all demo data from QAEstimator Pro database...');

  // 1. Clear relational data
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.testCase.deleteMany();
  await prisma.estimation.deleteMany();
  await prisma.estimationHistory.deleteMany();
  await prisma.project.deleteMany();
  await prisma.teamMember.deleteMany();

  // 2. Reset user to a clean, blank slate
  await prisma.user.deleteMany();
  
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const cleanUser = await prisma.user.create({
    data: {
      email: 'ramesh@qaestimator.io',
      password: passwordHash,
      name: 'QA Engineer',
      role: 'QA Lead',
      organization: 'My Testing Org',
    },
  });

  console.log('Successfully cleared all demo projects, test cases, estimations, history, team members, reports, and notifications.');
  console.log(`Clean user account ready: ${cleanUser.email} (password: password123) or user can register a new account.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
