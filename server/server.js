import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRouter from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ca03';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);

// Item Schema & Model explicitly mapped to collection 'items'
const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model('Item', itemSchema, 'items');

// Root route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Hello endpoint
app.get('/api/hello', (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.json({
    message: 'Hello from the server',
    status: isConnected ? 'Connected to server + MongoDB' : 'MongoDB disconnected',
    database: isConnected ? 'connected' : 'disconnected',
  });
});

// GET /api/items - list items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/items - create an item
app.post('/api/items', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }
    const newItem = new Item({ name: name.trim() });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/items/:id - delete an item
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid item ID format' });
    }
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully', item: deletedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
