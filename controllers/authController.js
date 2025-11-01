import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from '../services/prisma.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

export async function register(req, res) {
  try {
    const { name, email, password, role = 'patient', ...rest } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email ya registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name,
        email,
        passwordHash,
        role,
      }
    });

    if (role === 'doctor') {
      const { full_name, specialty_id, city_id, about, price, insurances, is_featured, photo_url, social_facebook, social_instagram, whatsapp } = rest;
      await prisma.doctor.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          fullName: full_name || name,
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
          status: 'pending'
        }
      });
    }

    const token = signToken(user);
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error en registro' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });
    const token = signToken(user);
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error en login' });
  }
}

