import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.cSRReport.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.job.deleteMany();
  await prisma.youthProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash('password123', 12);

  // Coordinator
  const coordinator = await prisma.user.create({
    data: {
      name: 'Mustafa Mhongera',
      email: 'coordinator@maishakazi.org',
      passwordHash: hash,
      role: 'COORDINATOR',
      phone: '+255712000001',
    },
  });

  // Clients
  const cocaCola = await prisma.user.create({
    data: {
      name: 'Coca-Cola Tanzania',
      email: 'coca-cola@demo.com',
      passwordHash: hash,
      role: 'CLIENT',
      phone: '+255712000010',
      clientProfile: {
        create: {
          orgName: 'Coca-Cola Kwanza Ltd',
          industry: 'Beverages',
          csrBudget: 5000000,
          brandColor: '#E61A27',
          primaryContactName: 'James Mwangi',
        },
      },
    },
    include: { clientProfile: true },
  });

  const vodacom = await prisma.user.create({
    data: {
      name: 'Vodacom Tanzania',
      email: 'vodacom@demo.com',
      passwordHash: hash,
      role: 'CLIENT',
      phone: '+255712000011',
      clientProfile: {
        create: {
          orgName: 'Vodacom Tanzania PLC',
          industry: 'Telecommunications',
          csrBudget: 8000000,
          brandColor: '#E60000',
          primaryContactName: 'Fatma Said',
        },
      },
    },
    include: { clientProfile: true },
  });

  const ttcl = await prisma.user.create({
    data: {
      name: 'TTCL Tanzania',
      email: 'ttcl@demo.com',
      passwordHash: hash,
      role: 'CLIENT',
      phone: '+255712000012',
      clientProfile: {
        create: {
          orgName: 'Tanzania Telecommunications Corporation',
          industry: 'Telecommunications',
          csrBudget: 3000000,
          brandColor: '#0056A0',
          primaryContactName: 'Baraka Nyamizi',
        },
      },
    },
    include: { clientProfile: true },
  });

  // Youth Workers
  const youthData = [
    { name: 'Amina Juma', email: 'amina@demo.com', phone: '+255712100001', bio: 'Experienced cleaner and gardener from Kinondoni', location: 'Kinondoni, Dar es Salaam', lat: -6.7724, lng: 39.2445, skills: ['CLEANING', 'GARDENING'], rating: 4.5, jobsCompleted: 12, earnings: 180000 },
    { name: 'Baraka Msemakweli', email: 'baraka@demo.com', phone: '+255712100002', bio: 'Skilled handyman with 3 years of experience', location: 'Ilala, Dar es Salaam', lat: -6.8235, lng: 39.2695, skills: ['HANDYWORK', 'WINDOW_FIX'], rating: 4.8, jobsCompleted: 25, earnings: 375000 },
    { name: 'Consolata Peter', email: 'consolata@demo.com', phone: '+255712100003', bio: 'Professional car wash specialist', location: 'Temeke, Dar es Salaam', lat: -6.8615, lng: 39.2862, skills: ['CAR_WASH', 'CLEANING'], rating: 4.2, jobsCompleted: 8, earnings: 120000 },
    { name: 'Daudi Moshi', email: 'daudi@demo.com', phone: '+255712100004', bio: 'Window fixer and general maintenance worker', location: 'Igbogo, Dar es Salaam', lat: -6.7900, lng: 39.2100, skills: ['WINDOW_FIX', 'HANDYWORK', 'GARDENING'], rating: 4.6, jobsCompleted: 18, earnings: 270000 },
    { name: 'Esther Kimaro', email: 'esther@demo.com', phone: '+255712100005', bio: 'Dedicated gardening and cleaning professional', location: 'Mbezi, Dar es Salaam', lat: -6.7400, lng: 39.2000, skills: ['GARDENING', 'CLEANING'], rating: 4.3, jobsCompleted: 10, earnings: 150000 },
    { name: 'Faraja Ngowi', email: 'faraja@demo.com', phone: '+255712100006', bio: 'Versatile worker skilled in multiple services', location: 'Kigamboni, Dar es Salaam', lat: -6.8700, lng: 39.3200, skills: ['CAR_WASH', 'CLEANING', 'HANDYWORK'], rating: 4.0, jobsCompleted: 6, earnings: 90000 },
    { name: 'Grace Macha', email: 'grace@demo.com', phone: '+255712100007', bio: 'Experienced cleaner with attention to detail', location: 'Mikocheni, Dar es Salaam', lat: -6.7600, lng: 39.2700, skills: ['CLEANING', 'GARDENING'], rating: 4.7, jobsCompleted: 20, earnings: 300000 },
    { name: 'Hassan Mwinyi', email: 'hassan@demo.com', phone: '+255712100008', bio: 'Car wash expert and handywork specialist', location: 'Sinza, Dar es Salaam', lat: -6.7800, lng: 39.2400, skills: ['CAR_WASH', 'HANDYWORK', 'WINDOW_FIX'], rating: 4.4, jobsCompleted: 15, earnings: 225000 },
  ];

  const youthUsers = [];
  for (const y of youthData) {
    const user = await prisma.user.create({
      data: {
        name: y.name,
        email: y.email,
        passwordHash: hash,
        role: 'YOUTH',
        phone: y.phone,
        youthProfile: {
          create: {
            bio: y.bio,
            location: y.location,
            locationLat: y.lat,
            locationLng: y.lng,
            skills: y.skills,
            rating: y.rating,
            totalJobsCompleted: y.jobsCompleted,
            totalEarnings: y.earnings,
            isVetted: true,
            vettedAt: new Date('2025-01-15'),
            vettedById: coordinator.id,
          },
        },
      },
    });
    youthUsers.push(user);
  }

  // Sample Jobs
  const now = new Date();
  const jobs = [
    { title: 'Office Deep Cleaning', description: 'Deep clean the Coca-Cola office floor 3', serviceType: 'CLEANING' as const, status: 'COMPLETED' as const, clientId: cocaCola.id, youthId: youthUsers[0].id, coordinatorId: coordinator.id, location: 'Coca-Cola Office, Dar es Salaam', fee: 25000, maishaCut: 5000, youthEarning: 20000, clientConfirmed: true, completedAt: new Date(now.getTime() - 2 * 86400000) },
    { title: 'Fleet Car Wash - 5 Vehicles', description: 'Wash and detail 5 company vehicles', serviceType: 'CAR_WASH' as const, status: 'COMPLETED' as const, clientId: cocaCola.id, youthId: youthUsers[2].id, coordinatorId: coordinator.id, location: 'Coca-Cola Parking, Dar es Salaam', fee: 50000, maishaCut: 10000, youthEarning: 40000, clientConfirmed: true, completedAt: new Date(now.getTime() - 5 * 86400000) },
    { title: 'Garden Maintenance', description: 'Monthly garden maintenance for Vodacom HQ', serviceType: 'GARDENING' as const, status: 'IN_PROGRESS' as const, clientId: vodacom.id, youthId: youthUsers[3].id, coordinatorId: coordinator.id, location: 'Vodacom HQ, Dar es Salaam', fee: 35000, maishaCut: 7000, youthEarning: 28000 },
    { title: 'Window Repair - 3rd Floor', description: 'Fix broken window panes on the 3rd floor', serviceType: 'WINDOW_FIX' as const, status: 'ASSIGNED' as const, clientId: vodacom.id, youthId: youthUsers[1].id, coordinatorId: coordinator.id, location: 'Vodacom Tower, Dar es Salaam', fee: 45000, maishaCut: 9000, youthEarning: 36000, scheduledAt: new Date(now.getTime() + 2 * 86400000) },
    { title: 'Office Cleaning - Weekly', description: 'Weekly cleaning of TTCL reception and offices', serviceType: 'CLEANING' as const, status: 'OPEN' as const, clientId: ttcl.id, location: 'TTCL Office, Dar es Salaam', fee: 20000 },
    { title: 'Parking Lot Cleanup', description: 'Clean and organize the parking area', serviceType: 'CLEANING' as const, status: 'COMPLETED' as const, clientId: cocaCola.id, youthId: youthUsers[6].id, coordinatorId: coordinator.id, location: 'Coca-Cola Depot, Dar es Salaam', fee: 15000, maishaCut: 3000, youthEarning: 12000, clientConfirmed: true, completedAt: new Date(now.getTime() - 10 * 86400000) },
    { title: 'Compound Gardening', description: 'Trim hedges and maintain the compound garden', serviceType: 'GARDENING' as const, status: 'COMPLETED' as const, clientId: vodacom.id, youthId: youthUsers[4].id, coordinatorId: coordinator.id, location: 'Vodacom Compound, Dar es Salaam', fee: 30000, maishaCut: 6000, youthEarning: 24000, clientConfirmed: true, completedAt: new Date(now.getTime() - 7 * 86400000) },
    { title: 'Executive Car Wash', description: 'Premium wash for executive vehicles', serviceType: 'CAR_WASH' as const, status: 'IN_PROGRESS' as const, clientId: ttcl.id, youthId: youthUsers[7].id, coordinatorId: coordinator.id, location: 'TTCL Parking, Dar es Salaam', fee: 40000, maishaCut: 8000, youthEarning: 32000 },
    { title: 'Window Installation', description: 'Install new windows in the conference room', serviceType: 'WINDOW_FIX' as const, status: 'OPEN' as const, clientId: cocaCola.id, location: 'Coca-Cola Conference Center', fee: 80000 },
    { title: 'Handyman - Shelf Installation', description: 'Install storage shelves in the break room', serviceType: 'HANDYWORK' as const, status: 'ASSIGNED' as const, clientId: vodacom.id, youthId: youthUsers[1].id, coordinatorId: coordinator.id, location: 'Vodacom Break Room', fee: 35000, maishaCut: 7000, youthEarning: 28000, scheduledAt: new Date(now.getTime() + 3 * 86400000) },
    { title: 'Deep Clean - Post Event', description: 'Clean up after corporate event', serviceType: 'CLEANING' as const, status: 'COMPLETED' as const, clientId: ttcl.id, youthId: youthUsers[0].id, coordinatorId: coordinator.id, location: 'TTCL Event Hall', fee: 45000, maishaCut: 9000, youthEarning: 36000, clientConfirmed: true, completedAt: new Date(now.getTime() - 3 * 86400000) },
    { title: 'Car Wash - Monthly Service', description: 'Monthly car wash package for fleet', serviceType: 'CAR_WASH' as const, status: 'OPEN' as const, clientId: vodacom.id, location: 'Vodacom Fleet Depot', fee: 100000 },
    { title: 'Garden Landscaping', description: 'New landscaping design for front entrance', serviceType: 'GARDENING' as const, status: 'DISPUTED' as const, clientId: cocaCola.id, youthId: youthUsers[4].id, coordinatorId: coordinator.id, location: 'Coca-Cola Entrance, Dar es Salaam', fee: 60000, maishaCut: 12000, youthEarning: 48000 },
    { title: 'General Repairs', description: 'Fix door handles and replace light fixtures', serviceType: 'HANDYWORK' as const, status: 'COMPLETED' as const, clientId: ttcl.id, youthId: youthUsers[3].id, coordinatorId: coordinator.id, location: 'TTCL Main Building', fee: 25000, maishaCut: 5000, youthEarning: 20000, clientConfirmed: true, completedAt: new Date(now.getTime() - 14 * 86400000) },
    { title: 'Emergency Window Fix', description: 'Urgent repair of broken window due to storm', serviceType: 'WINDOW_FIX' as const, status: 'CANCELLED' as const, clientId: vodacom.id, location: 'Vodacom Satellite Office', fee: 55000 },
  ];

  for (const j of jobs) {
    await prisma.job.create({
      data: {
        title: j.title,
        description: j.description,
        serviceType: j.serviceType,
        status: j.status,
        clientId: j.clientId,
        youthId: j.youthId || null,
        coordinatorId: j.coordinatorId || null,
        location: j.location,
        scheduledAt: j.scheduledAt || null,
        completedAt: j.completedAt || null,
        fee: j.fee,
        maishaCut: j.maishaCut || null,
        youthEarning: j.youthEarning || null,
        clientConfirmed: j.clientConfirmed || false,
      },
    });
  }

  // CSR Reports
  const csrReports = [
    { clientId: cocaCola.clientProfile!.id, periodStart: new Date('2025-10-01'), periodEnd: new Date('2025-10-31'), totalJobs: 12, totalYouthPaid: 5, totalAmount: 340000, totalImpact: '48 hours of youth employment, 5 youth supported in Kinondoni district' },
    { clientId: vodacom.clientProfile!.id, periodStart: new Date('2025-10-01'), periodEnd: new Date('2025-10-31'), totalJobs: 8, totalYouthPaid: 4, totalAmount: 280000, totalImpact: '36 hours of youth employment, 4 youth supported across Dar es Salaam' },
    { clientId: ttcl.clientProfile!.id, periodStart: new Date('2025-10-01'), periodEnd: new Date('2025-10-31'), totalJobs: 5, totalYouthPaid: 3, totalAmount: 150000, totalImpact: '20 hours of youth employment, 3 youth supported in Ilala district' },
  ];

  for (const r of csrReports) {
    await prisma.cSRReport.create({ data: r });
  }

  // Sample notifications
  await prisma.notification.createMany({
    data: [
      { userId: youthUsers[0].id, message: 'You have been assigned a new job: Office Deep Cleaning', type: 'JOB_ASSIGNED' },
      { userId: youthUsers[1].id, message: 'You have been assigned a new job: Window Repair - 3rd Floor', type: 'JOB_ASSIGNED' },
      { userId: cocaCola.id, message: 'Job "Office Deep Cleaning" has been completed', type: 'JOB_COMPLETED', isRead: true },
      { userId: coordinator.id, message: 'New job request from Coca-Cola: Window Installation', type: 'JOB_REQUEST' },
      { userId: coordinator.id, message: 'Garden Landscaping job has been disputed by Coca-Cola', type: 'DISPUTE_RAISED' },
    ],
  });

  console.log('Seed completed successfully!');
  console.log(`Created: 1 coordinator, 3 clients, 8 youth, 15 jobs, 3 CSR reports`);
  console.log('\nLogin credentials (all accounts): password123');
  console.log('Coordinator: coordinator@maishakazi.org');
  console.log('Clients: coca-cola@demo.com, vodacom@demo.com, ttcl@demo.com');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
