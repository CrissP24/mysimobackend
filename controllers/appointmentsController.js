import { prisma } from '../services/prisma.js';
import { v4 as uuidv4 } from 'uuid';

export async function createAppointment(req, res) {
  try {
    const { doctor_id, date_time, notes } = req.body;
    if (!doctor_id || !date_time) return res.status(400).json({ error: 'doctor_id y date_time requeridos' });
    const appt = await prisma.appointment.create({
      data: {
        id: uuidv4(),
        patientId: req.user.id,
        doctorId: doctor_id,
        dateTime: new Date(date_time),
        notes: notes || '',
        status: 'pending'
      }
    });
    return res.status(201).json(appt);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al crear cita' });
  }
}

export async function getMyAppointments(req, res) {
  try {
    const role = req.user.role;
    if (role === 'patient') {
      const list = await prisma.appointment.findMany({
        where: { patientId: req.user.id },
        include: { doctor: { include: { specialty: true, city: true } } },
        orderBy: { dateTime: 'desc' }
      });
      return res.json(list);
    }
    if (role === 'doctor') {
      const doctor = await prisma.doctor.findFirst({ where: { userId: req.user.id } });
      if (!doctor) return res.json([]);
      const list = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: { patient: true },
        orderBy: { dateTime: 'desc' }
      });
      return res.json(list);
    }
    // admin: see all
    const list = await prisma.appointment.findMany({ orderBy: { dateTime: 'desc' } });
    return res.json(list);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Error al obtener citas' });
  }
}

