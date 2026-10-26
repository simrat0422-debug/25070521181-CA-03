import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import expensesRouter from './routes/expenses.js';
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(',') ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));
app.use('/api/expenses', expensesRouter);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
 if (error.name === 'ValidationError' || error.name === 'CastError') return res.status(400).json({ message: error.message });
 if (error instanceof SyntaxError && 'body' in error) return res.status(400).json({ message: 'Request body must be valid JSON.' });
 console.error(error); res.status(500).json({ message: 'Something went wrong on the server.' });
});
const port = Number(process.env.PORT) || 5000;
try { await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_expenses'); app.listen(port, () => console.log(`Student expense API listening at http://localhost:${port}`)); }
catch (error) { console.error('Could not connect to MongoDB. Check MONGODB_URI and database availability.', error.message); process.exit(1); }
