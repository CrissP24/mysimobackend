import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from '../routes/auth.js';
import doctorRoutes from '../routes/doctors.js';
import metaRoutes from '../routes/meta.js';
import appointmentRoutes from '../routes/appointments.js';
import chatRoutes from '../routes/chat.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// ✅ Configuración CORS explícita (Frontend + Local)
const allowedOrigins = [
  'https://mysimofrontend.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (como Postman o curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked from origin: ${origin}`));
  },
  credentials: true,
}));

// ✅ Middlewares
app.use(express.json());
app.use(morgan('dev'));

// ✅ Endpoint de salud
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', name: 'mysimo-api' });
});

// ✅ Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api', metaRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/chat', chatRoutes);

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// ✅ Manejador de errores
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ✅ Iniciar servidor
app.listen(port, () => {
  console.log(`mysimo backend running on port ${port}`);
});


