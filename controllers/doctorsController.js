import { prisma } from '../services/prisma.js';
import { v4 as uuidv4 } from 'uuid';

export async function listDoctors(req, res) {
  try {
    const { q, specialty, city, featured, insurance, page = 1, limit = 20 } = req.query;
    const take = Math.min(Number(limit) || 20, 50);
    const skip = (Number(page) - 1) * take || 0;

    const where = {
      AND: [
        q ? { OR: [ { fullName: { contains: q, mode: 'insensitive' } } ] } : {},
        specialty ? { specialty: { name: { equals: specialty, mode: 'insensitive' } } } : {},
        city ? { city: { name: { equals: city, mode: 'insensitive' } } } : {},
        insurance ? { insurances: { has: insurance } } : {},
      ]
    };

    // Featured logic: isFeatured=true or active ad within date range
    const today = new Date();
    const featuredWhere = {
      OR: [
        { isFeatured: true },
        { ads: { some: { startDate: { lte: today }, endDate: { gte: today } } } }
      ],
      ...where
    };

    // If featured param true, only return featured set
    if (featured === 'true') {
      const featuredDocs = await prisma.doctor.findMany({
        where: featuredWhere,
        include: { specialty: true, city: true },
        orderBy: [
          { isFeatured: 'desc' },
          { ads: { _count: 'desc' } }
        ],
        take: 8
      });
      return res.json({ results: featuredDocs.length, data: featuredDocs });
    }

    const featuredDocs = await prisma.doctor.findMany({
      where: featuredWhere,
      include: { specialty: true, city: true },
      orderBy: [ { isFeatured: 'desc' } ],
      take: 8
    });

    const total = await prisma.doctor.count({ where });
    const others = await prisma.doctor.findMany({
      where,
      include: { specialty: true, city: true },
      skip,
      take,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      featured: featuredDocs,
      results: others.length,
      total,
      page: Number(page) || 1,
      limit: take,
      data: others
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al listar doctores' });
  }
}

export async function getDoctorById(req, res) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: { specialty: true, city: true }
    });
    if (!doctor) return res.status(404).json({ error: 'Médico no encontrado' });
    return res.json(doctor);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al obtener médico' });
  }
}

export async function createDoctor(req, res) {
  try {
    const { user_id, full_name, specialty_id, city_id, about, price, insurances, is_featured, photo_url, social_facebook, social_instagram, whatsapp, status = 'pending' } = req.body;
    const doctor = await prisma.doctor.create({
      data: {
        id: uuidv4(),
        userId: user_id,
        fullName: full_name,
        specialtyId: specialty_id || null,
        cityId: city_id || null,
        about: about || '',
        price: price ? Number(price) : null,
        insurances: Array.isArray(insurances) ? insurances : [],
        isFeatured: Boolean(is_featured) || false,
        photoUrl: photo_url || null,
        socialFacebook: social_facebook || null,
        socialInstagram: social_instagram || null,
        whatsapp: whatsapp || null,
        status
      }
    });
    return res.status(201).json(doctor);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al crear médico' });
  }
}

export async function updateDoctor(req, res) {
  try {
    // Ownership check is handled by middleware in future; for now allow admin or same user
    const { id } = req.params;
    const data = req.body;
    // Map incoming snake_case to camelCase
    const mapped = {
      fullName: data.full_name,
      specialtyId: data.specialty_id,
      cityId: data.city_id,
      about: data.about,
      price: data.price !== undefined ? Number(data.price) : undefined,
      insurances: data.insurances,
      isFeatured: data.is_featured,
      photoUrl: data.photo_url,
      socialFacebook: data.social_facebook,
      socialInstagram: data.social_instagram,
      whatsapp: data.whatsapp,
      status: data.status,
    };
    Object.keys(mapped).forEach(k => mapped[k] === undefined && delete mapped[k]);

    const updated = await prisma.doctor.update({
      where: { id },
      data: mapped,
      include: { specialty: true, city: true }
    });
    return res.json(updated);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al actualizar médico' });
  }
}

