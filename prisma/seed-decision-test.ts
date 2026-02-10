import { PrismaClient, Status, Confidence, VehicleType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for testing Decision Engine UI states
 *
 * Creates a single trail with 10 varied reports to test:
 * - High Risk vs Low Risk UI states
 * - Fresh vs Stale indicators
 * - Different vehicle types and conditions
 *
 * Run with: npx tsx prisma/seed-decision-test.ts
 */
async function main() {
  console.log('Starting Decision Engine test seed...');

  // Create test users
  const users = await Promise.all(
    Array.from({ length: 5 }, () =>
      prisma.user.create({ data: { isAnonymous: true } })
    )
  );
  console.log(`Created ${users.length} test users`);

  // Create or upsert the test trail with baseDifficulty
  const testTrail = await prisma.trail.upsert({
    where: { id: 'decision-test-trail' },
    update: {
      baseDifficulty: 3, // Difficult trail - good for testing match logic
    },
    create: {
      id: 'decision-test-trail',
      name: 'Decision Engine Test Trail',
      region: 'California',
      latitude: 38.85,
      longitude: -120.05,
      description: 'Test trail for Decision Engine development. Features varied terrain suitable for testing risk calculations.',
      baseDifficulty: 3,
    },
  });
  console.log(`Created/updated test trail: ${testTrail.name} (baseDifficulty: ${testTrail.baseDifficulty})`);

  // Delete existing reports for this trail to start fresh
  await prisma.conditionReport.deleteMany({
    where: { trailId: testTrail.id },
  });
  console.log('Cleared existing test reports');

  // Time helpers
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Create 10 varied reports
  const reports: Array<{
    userId: string;
    trailId: string;
    status: Status;
    confidence: Confidence;
    vehicleType: VehicleType;
    notes: string;
    timestamp: Date;
  }> = [
    // Report 1: Very fresh, clear, high confidence (Extreme Build)
    {
      userId: users[0].id,
      trailId: testTrail.id,
      status: 'clear',
      confidence: 'high',
      vehicleType: 'lifted4x4_IFS',
      notes: 'Ran it yesterday with my long travel rig. No issues at all.',
      timestamp: hoursAgo(6),
    },

    // Report 2: Fresh, clear, medium confidence (Modified 4x4)
    {
      userId: users[1].id,
      trailId: testTrail.id,
      status: 'clear',
      confidence: 'medium',
      vehicleType: 'lifted4x4_solidAxle',
      notes: 'Made it through with 35s and lockers. A few tight spots.',
      timestamp: hoursAgo(48),
    },

    // Report 3: Fresh, rough, high confidence (HC 4x4)
    {
      userId: users[2].id,
      trailId: testTrail.id,
      status: 'rough',
      confidence: 'high',
      vehicleType: 'stockSUV_IFS',
      notes: 'Taco made it but scraped the skids hard. Would not recommend for stock.',
      timestamp: daysAgo(3),
    },

    // Report 4: Getting stale, rough, medium confidence (Stock AWD)
    {
      userId: users[3].id,
      trailId: testTrail.id,
      status: 'rough',
      confidence: 'medium',
      vehicleType: 'stockSUV_solidAxle',
      notes: 'RAV4 struggled badly. Had to turn around halfway.',
      timestamp: daysAgo(10),
    },

    // Report 5: Stale, impassable, high confidence (Stock AWD)
    {
      userId: users[4].id,
      trailId: testTrail.id,
      status: 'impassable',
      confidence: 'high',
      vehicleType: 'stockSUV_solidAxle',
      notes: 'Subaru Outback could not make it past the first rock section.',
      timestamp: daysAgo(18),
    },

    // Report 6: Stale, clear, low confidence (Extreme Build)
    {
      userId: users[0].id,
      trailId: testTrail.id,
      status: 'clear',
      confidence: 'low',
      vehicleType: 'lifted4x4_IFS',
      notes: 'Heard from a buddy it was fine. Did not run it myself.',
      timestamp: daysAgo(20),
    },

    // Report 7: Very stale, rough, medium confidence (Modified)
    {
      userId: users[1].id,
      trailId: testTrail.id,
      status: 'rough',
      confidence: 'medium',
      vehicleType: 'lifted4x4_solidAxle',
      notes: 'Some washouts from winter storms. Lockers required.',
      timestamp: daysAgo(25),
    },

    // Report 8: Very stale, clear, high confidence (Side by Side)
    {
      userId: users[2].id,
      trailId: testTrail.id,
      status: 'clear',
      confidence: 'high',
      vehicleType: 'sideBySide',
      notes: 'RZR Pro R handled it easily. Great trail for UTVs.',
      timestamp: daysAgo(28),
    },

    // Report 9: Ancient, impassable, medium confidence (Dirt Bike)
    {
      userId: users[3].id,
      trailId: testTrail.id,
      status: 'impassable',
      confidence: 'medium',
      vehicleType: 'dirtBike',
      notes: 'Trail was closed for erosion control.',
      timestamp: daysAgo(45),
    },

    // Report 10: Very old, clear, low confidence (HC 4x4)
    {
      userId: users[4].id,
      trailId: testTrail.id,
      status: 'clear',
      confidence: 'low',
      vehicleType: 'stockSUV_IFS',
      notes: 'Summer conditions, dry and dusty.',
      timestamp: daysAgo(60),
    },
  ];

  // Insert all reports
  await prisma.conditionReport.createMany({ data: reports });
  console.log(`Created ${reports.length} varied test reports`);

  // Summary
  console.log('\n--- Test Data Summary ---');
  console.log(`Trail ID: ${testTrail.id}`);
  console.log(`Trail: ${testTrail.name}`);
  console.log(`Base Difficulty: ${testTrail.baseDifficulty} (1=easy, 4=extreme)`);
  console.log('\nReports by freshness:');
  console.log('  - Fresh (<7 days): 3 reports');
  console.log('  - Getting stale (7-14 days): 1 report');
  console.log('  - Stale (>14 days): 6 reports');
  console.log('\nReports by status:');
  console.log('  - Clear: 4 reports');
  console.log('  - Rough: 4 reports');
  console.log('  - Impassable: 2 reports');
  console.log('\nExpected UI states:');
  console.log('  - Extreme Build (cap 4): Strong Match (recent clear)');
  console.log('  - Modified 4x4 (cap 3): Strong Match (matches difficulty)');
  console.log('  - HC 4x4 (cap 2): High Risk (below difficulty)');
  console.log('  - Stock AWD (cap 1): High Risk (well below difficulty)');
  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
