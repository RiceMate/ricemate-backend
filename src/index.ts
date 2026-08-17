import 'dotenv/config';
import app from './app';

const PORT = Number(process.env.PORT) || 3000;

const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`✅  RiceMate API is running on http://localhost:${PORT}`);
  console.log(`    Network     : http://10.34.1.39:${PORT}`);
  console.log(`    Environment : ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`    Health check: http://localhost:${PORT}/health`);
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = (signal: string) => {
  console.log(`\n⚠️   Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('👋  HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
