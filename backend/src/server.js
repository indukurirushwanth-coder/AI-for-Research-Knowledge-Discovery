import 'dotenv/config';
import app from './app.js';
import { initDb } from './config/db.js';
import { getModelName } from './services/gemini.service.js';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await initDb();

    const server = app.listen(PORT, () => {
      console.log('=======================================================');
      console.log(`🚀 ResearchLens AI Backend running on http://localhost:${PORT}`);
      console.log(`📊 Health Endpoint: http://localhost:${PORT}/api/health`);
      console.log(`🤖 Gemini Model: ${getModelName()}`);
      console.log('=======================================================');
    });

    const shutdown = () => {
      console.log('\n🛑 Gracefully shutting down server...');
      server.close(() => {
        console.log('✅ HTTP server closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();

export { app, startServer };
