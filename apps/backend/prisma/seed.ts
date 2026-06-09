import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const BCRYPT_COST = 12;

  // 1. Create Concierge
  const conciergePasswordHash = await bcrypt.hash('porteiro123', BCRYPT_COST);
  const concierge = await prisma.concierge.upsert({
    where: { email: 'porteiro@infoseg.com' },
    update: {},
    create: {
      name: 'Carlos Silva',
      email: 'porteiro@infoseg.com',
      phone: '11999990001',
      password_hash: conciergePasswordHash,
    },
  });
  console.log(`Created concierge: ${concierge.name} (${concierge.email})`);

  // 2. Create Residents
  const residentPasswordHash = await bcrypt.hash('morador123', BCRYPT_COST);

  const resident1 = await prisma.resident.upsert({
    where: { email: 'maria@morador.com' },
    update: {},
    create: {
      name: 'Maria Santos',
      apartment_number: '101',
      block: 'A',
      phone: '11999990002',
      email: 'maria@morador.com',
      password_hash: residentPasswordHash,
    },
  });
  console.log(`Created resident: ${resident1.name} (${resident1.email})`);

  const resident2 = await prisma.resident.upsert({
    where: { email: 'joao@morador.com' },
    update: {},
    create: {
      name: 'João Oliveira',
      apartment_number: '202',
      block: 'B',
      phone: '11999990003',
      email: 'joao@morador.com',
      password_hash: residentPasswordHash,
    },
  });
  console.log(`Created resident: ${resident2.name} (${resident2.email})`);

  // 3. Create Visitor
  const visitor = await prisma.visitor.create({
    data: {
      name: 'Pedro Visitante',
      document: '12345678901',
    },
  });
  console.log(`Created visitor: ${visitor.name} (${visitor.document})`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
