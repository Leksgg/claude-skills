import express from 'express';
import mongoose from 'mongoose';
import { config } from './config';
import { requireAdminKey } from './middleware/adminKey';
import { requireAuth } from './middleware/auth';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import filesRoutes from './routes/files.routes';
import healthRoutes from './routes/health.routes';
import ordersRoutes from './routes/orders.routes';
import reportsRoutes from './routes/reports.routes';
import reviewsRoutes from './routes/reviews.routes';
import usersRoutes from './routes/users.routes';

const app = express();
app.use(express.json({ limit: '100kb' }));

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAdminKey, adminRoutes);

app.use('/api', requireAuth);
app.use('/api/users', usersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/products', reviewsRoutes);

await mongoose.connect(config.mongoUrl);
app.listen(config.port, () => console.log(`API escuchando en :${config.port}`));
