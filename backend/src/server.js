import app from './app.js';
import { env } from './config/env.js';
import pool from './config/db.js';

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected');

    app.listen(env.port, () => {
      console.log(`🚀 Backend running on port ${env.port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
