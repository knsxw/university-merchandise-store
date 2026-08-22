import app from './app';
import { config, initializeKeyVaultSecrets } from './config/env';
import prisma from './config/db';

async function startServer() {
  try {
    // Attempt Azure Key Vault secrets loading if configured
    await initializeKeyVaultSecrets();

    // Verify database connection
    await prisma.$connect();
    console.log('✅ Connected to MySQL Database successfully via Prisma');

    const port = config.port;
    app.listen(port, () => {
      console.log(`🚀 Smart University Merchandise Store API is running on http://localhost:${port}`);
      console.log(`📋 Health Check: http://localhost:${port}/api/health`);
      console.log(`🔑 Peer Available Products API: http://localhost:${port}/api/products/available (Header: x-api-key: ${config.partnerExposedApiKey})`);
    });
  } catch (error) {
    console.error('❌ Failed to start backend server:', error);
    process.exit(1);
  }
}

startServer();
