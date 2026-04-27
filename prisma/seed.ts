import { PrismaClient, Role, MediaType, Rating, Review } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { faker } from '@faker-js/faker';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const USERS = Array.from({ length: 50 }, () => ({
  username: faker.internet.username().toLowerCase(),
  email: faker.internet.email().toLowerCase(),
}));

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('Seeding database...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.review.deleteMany();

  // Seed admin

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@dev.local',
      role: Role.ADMIN,
    },
  });

  console.log(`Admin seeded — id=${admin.id} username=${admin.username}`);

  // Create users
  const createdUsers = await prisma.user.createManyAndReturn({
    data: USERS,
  });

  console.log(`Created ${createdUsers.length} users`);

  const userIds = [...createdUsers.map((u) => u.id), admin.id];

  const ratingData: Omit<Rating, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const ratingKeys = new Set<string>();
  while (ratingData.length < 500) {
    const rating = {
      userId: randomItem(userIds),
      mediaId: faker.number.int({ min: 1, max: 1000 }),
      mediaType: randomItem([MediaType.movie, MediaType.tv]),
      score: faker.number.float({ min: 1, max: 10, fractionDigits: 1 }),
    };
    const key = `${rating.userId}-${rating.mediaId}-${rating.mediaType}`;
    if (!ratingKeys.has(key)) {
      ratingData.push(rating);
      ratingKeys.add(key);
    }
  }

  const ratingResult = await prisma.rating.createMany({
    data: ratingData,
  });
  // eslint-disable-next-line no-console
  console.log(`Created ${ratingResult.count} ratings`);

  const reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const reviewKeys = new Set<string>();
  while (reviewData.length < 500) {
    const review = {
      userId: randomItem(userIds),
      mediaId: faker.number.int({ min: 1, max: 1000 }),
      mediaType: randomItem([MediaType.movie, MediaType.tv]),
      title: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(),
    };
    const key = `${review.userId}-${review.mediaId}-${review.mediaType}`;
    if (!reviewKeys.has(key)) {
      reviewData.push(review);
      reviewKeys.add(key);
    }
  }

  const reviewResult = await prisma.review.createMany({
    data: reviewData,
  });
  // eslint-disable-next-line no-console
  console.log(`Created ${reviewResult.count} reviews`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
