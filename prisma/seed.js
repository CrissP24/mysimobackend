import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mysimo...');

  // 0. SUPER ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@mysimo.ec' },
    update: {},
    create: {
      id: uuidv4(),
      name: 'Administrador General',
      email: 'admin@mysimo.ec',
      passwordHash: '$2a$10$3R4V/PYgJ1ZaASe1S6u3g.YmlGU0b21bi4oeTfT9Q23iqPNPCcTGK', // "Admin123"
      role: 'admin',
    },
  });

  // 1. ESPECIALIDADES
  const specialties = [
    'Cardiología',
    'Odontología',
    'Traumatología',
    'Dermatología',
    'Pediatría',
    'Ginecología',
    'Neurología'
  ];

  for (const name of specialties) {
    await prisma.specialty.upsert({
      where: { name },    // name es unique en tu schema
      update: {},
      create: { name },
    });
  }

  // 2. CIUDADES
  const cities = [
    { name: 'Guayaquil', countryCode: 'EC' },
    { name: 'Quito', countryCode: 'EC' },
    { name: 'Manta', countryCode: 'EC' },
    { name: 'Jipijapa', countryCode: 'EC' },
  ];

  for (const c of cities) {
    await prisma.city.upsert({
      where: { name: c.name },  // 👈 usamos name, que es unique
      update: {},
      create: c,
    });
  }

  // Traer listas para usarlas abajo
  const cityList = await prisma.city.findMany();
  const specList = await prisma.specialty.findMany();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // 3. Crear 3 pacientes
  for (let i = 1; i <= 3; i++) {
    await prisma.user.upsert({
      where: { email: `paciente${i}@mail.com` },
      update: {},
      create: {
        id: uuidv4(),
        name: `Paciente ${i}`,
        email: `paciente${i}@mail.com`,
        // bcrypt de "123456"
        passwordHash: '$2a$10$FjX6bqz9D0JkqZbH3eW4Ne2m7G0pZQ0o7dS.5wA9Xb6oPUrG6Ff5a',
        role: 'patient',
      },
    });
  }

  // 4. Crear 5 doctores (2 destacados)
  for (let i = 1; i <= 5; i++) {
    const user = await prisma.user.upsert({
      where: { email: `doctor${i}@mail.com` },
      update: {},
      create: {
        id: uuidv4(),
        name: `Doctor ${i}`,
        email: `doctor${i}@mail.com`,
        passwordHash: '$2a$10$FjX6bqz9D0JkqZbH3eW4Ne2m7G0pZQ0o7dS.5wA9Xb6oPUrG6Ff5a', // same hash
        role: 'doctor',
      },
    });

    // where by unique userId
    await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        id: uuidv4(),
        userId: user.id,
        fullName: `Dr. ${user.name}`,
        specialtyId: pick(specList).id,
        cityId: pick(cityList).id,
        about: 'Atención integral con enfoque humano.',
        price: 35 + i * 5,
        insurances: ['IESS', 'Privado'],
        isFeatured: i <= 2,
        photoUrl: null,
        socialFacebook: null,
        socialInstagram: null,
        whatsapp: '+593987654321',
        status: 'active',
      },
    });
  }

  // 5. Ads opcionales para los destacados
  const docs = await prisma.doctor.findMany({
    where: { isFeatured: true },
  });

  for (const d of docs) {
    await prisma.adsDoctor.create({
      data: {
        doctorId: d.id,
        startDate: new Date(Date.now() - 86400000),        // ayer
        endDate: new Date(Date.now() + 7 * 86400000),      // +7 días
        priority: 1,
      },
    });
  }

  console.log('Seed complete ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
