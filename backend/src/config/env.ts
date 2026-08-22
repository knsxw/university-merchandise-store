import dotenv from 'dotenv';
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
  azureKeyVaultUri?: string;
  openaiApiKey?: string;
  openaiModel: string;
  peerEducoreApiUrl: string;
  peerEducoreApiKey: string;
  partnerExposedApiKey: string;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:merch_secure_pass@localhost:3306/merch_store',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_signing_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  azureClientSecret: process.env.AZURE_CLIENT_SECRET,
  azureKeyVaultUri: process.env.AZURE_KEY_VAULT_URI,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  peerEducoreApiUrl: process.env.PEER_EDUCORE_API_URL || 'https://api.educore.mock/api',
  peerEducoreApiKey: process.env.PEER_EDUCORE_API_KEY || 'educore_partner_secret_key_12345',
  partnerExposedApiKey: process.env.PARTNER_EXPOSED_API_KEY || 'partner_incoming_api_key_98765',
};

/**
 * Initializes secrets from Azure Key Vault when running on Azure Cloud
 */
export async function initializeKeyVaultSecrets(): Promise<void> {
  if (!config.azureKeyVaultUri) {
    console.log('ℹ️  Azure Key Vault URI not provided. Using environment variables.');
    return;
  }

  try {
    console.log(`🔐 Connecting to Azure Key Vault: ${config.azureKeyVaultUri}...`);
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(config.azureKeyVaultUri, credential);

    // Retrieve database URL or other secrets if present in Key Vault
    const dbUrlSecret = await secretClient.getSecret('DATABASE-URL').catch(() => null);
    if (dbUrlSecret?.value) config.databaseUrl = dbUrlSecret.value;

    const jwtSecret = await secretClient.getSecret('JWT-SECRET').catch(() => null);
    if (jwtSecret?.value) config.jwtSecret = jwtSecret.value;

    const openaiSecret = await secretClient.getSecret('OPENAI-API-KEY').catch(() => null);
    if (openaiSecret?.value) config.openaiApiKey = openaiSecret.value;

    console.log('✅ Azure Key Vault secrets successfully loaded.');
  } catch (error) {
    console.warn('⚠️  Could not fetch secrets from Azure Key Vault. Falling back to local env variables.', (error as Error).message);
  }
}
