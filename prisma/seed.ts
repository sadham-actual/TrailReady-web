import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create anonymous users for the seed reports
  const user1 = await prisma.user.create({
    data: { isAnonymous: true },
  });

  const user2 = await prisma.user.create({
    data: { isAnonymous: true },
  });

  const user3 = await prisma.user.create({
    data: { isAnonymous: true },
  });

  const user4 = await prisma.user.create({
    data: { isAnonymous: true },
  });

  console.log('Created 4 anonymous users');

  // Create trails with their reports
  // Trail 1: Alpine Loop
  const alpineLoop = await prisma.trail.create({
    data: {
      name: 'Alpine Loop',
      region: 'Colorado',
      latitude: 38.8,
      longitude: -106.9,
      description: 'Scenic mountain loop with moderate difficulty',
      reports: {
        create: [
          {
            userId: user1.id,
            timestamp: new Date(Date.now() - 3600000), // 1 hour ago
            status: 'clear',
            confidence: 'high',
            notes: 'All good, easy pass',
            vehicleType: 'lifted4x4_solidAxle',
          },
          {
            userId: user2.id,
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            status: 'rough',
            confidence: 'medium',
            notes: 'Some rocks, need careful driving',
            vehicleType: 'stockSUV_solidAxle',
          },
        ],
      },
    },
  });

  console.log(`Created trail: ${alpineLoop.name}`);

  // Trail 2: Moab Slickrock
  const moabSlickrock = await prisma.trail.create({
    data: {
      name: 'Moab Slickrock',
      region: 'Utah',
      latitude: 38.6,
      longitude: -109.5,
      description: 'Famous slickrock trail requiring 4x4',
      reports: {
        create: [
          {
            userId: user3.id,
            timestamp: new Date(Date.now() - 7200000), // 2 hours ago
            status: 'rough',
            confidence: 'high',
            notes: 'Technical sections require high clearance',
            vehicleType: 'lifted4x4_IFS',
          },
        ],
      },
    },
  });

  console.log(`Created trail: ${moabSlickrock.name}`);

  // Trail 3: Rubicon Trail
  const rubiconTrail = await prisma.trail.create({
    data: {
      name: 'Rubicon Trail',
      region: 'California',
      latitude: 38.8,
      longitude: -120.0,
      description: 'Legendary extreme 4x4 trail',
      reports: {
        create: [
          {
            userId: user4.id,
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            status: 'rough',
            confidence: 'high',
            notes: 'Very challenging, experienced drivers only',
            vehicleType: 'lifted4x4_solidAxle',
          },
        ],
      },
    },
  });

  console.log(`Created trail: ${rubiconTrail.name}`);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
