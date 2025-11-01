import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { prisma } from '../services/prisma.js';

dotenv.config();

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function requireRoleOrOwner(roles = []) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Prohibido' });
  };
}

export async function isDoctorOwner(req, res, next) {
  // For PUT /api/doctors/:id ensure the doctor belongs to the logged user or admin
  if (!req.user) return res.status(401).json({ error: 'No autorizado' });
  if (req.user.role === 'admin') return next();
  const doctorId = req.params.id;
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (doctor && doctor.userId === req.user.id) return next();
  return res.status(403).json({ error: 'No eres propietario de este perfil' });
}

