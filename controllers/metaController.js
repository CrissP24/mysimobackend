import { prisma } from '../services/prisma.js';

export async function getSpecialties(_req, res) {
  try {
    const data = await prisma.specialty.findMany({ orderBy: { name: 'asc' } });
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al listar especialidades' });
  }
}

export async function getCities(_req, res) {
  try {
    const data = await prisma.city.findMany({ orderBy: { name: 'asc' } });
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al listar ciudades' });
  }
}

