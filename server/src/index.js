import 'dotenv/config';
import express from 'express';
import corsMiddleware from './middleware/cors.js';
import errorHandler from './middleware/errorHandler.js';
import storiesRouter from './routes/stories.js';
import turnsRouter from './routes/turns.js';

const app = express();
const PORT = process.env.PORT || 3001;


app.use(corsMiddleware);
app.use(express.json());


app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/stories', storiesRouter);
app.use('/api/stories', turnsRouter);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎭 AI Storyteller server running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS origin: ${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}`);
});
