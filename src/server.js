import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errors } from 'celebrate';
import 'dotenv/config';

import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';

import notesRoutes from './routes/notesRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();
const PORT = process.env.PORT ?? 3030;

// 🔐 важливо для роботи secure cookies за проксі (Render/HTTPS)
app.set('trust proxy', 1);

// 🌐 CORS — ставимо ЯКНАЙВИЩЕ, до всіх роутів
const FRONT_ORIGINS = [
  'http://localhost:3000',
  'https://09-auth-wine-seven.vercel.app',
];

app.use(
  cors({
    origin: FRONT_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// 📝 базові мідлвари
app.use(logger);
app.use(express.json());
app.use(cookieParser());

// 🚏 роутинг
app.use(notesRoutes);
app.use(authRoutes);
app.use(userRoutes);

// 🧭 404 та обробка помилок
app.use(notFoundHandler);
app.use(errors());
app.use(errorHandler);

// 🚀 підключення БД та старт сервера
await connectMongoDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
