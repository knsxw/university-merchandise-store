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
  corsOrigins: string[];
  adminEmails: string[];
}

const DEFAULT_DATABASE_URL = 'mysql://root:merch_secure_pass@localhost:3306/merch_store';
const DEFAULT_JWT_SECRET = 'super_secret_jwt_signing_key_change_in_production';
const DEFAULT_PEER_API_KEY = 'educore_partner_secret_key_12345';
const DEFAULT_PARTNER_API_KEY = 'partner_incoming_api_key_98765';

const parseCsv = (value?: string): string[] =>
  (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const isConfiguredValue = (value?: string): value is string =>
  !!value && !value.toLowerCase().includes('here');

/**
 * Gates whether the /auth/microsoft endpoint enforces verified ID tokens.
 * Both values are required so the frontend and backend cannot accidentally
 * disagree about whether real Entra authentication is active.
 */
export const isEntraConfigured = (): boolean =>
  isConfiguredValue(config.azureClientId) && isConfiguredValue(config.azureTenantId);

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || DEFAULT_DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  azureTenantId: process.env.AZURE_TENANT_ID,
  azureClientId: process.env.AZURE_CLIENT_ID,
  azureClientSecret: process.env.AZURE_CLIENT_SECRET,
  azureKeyVaultUri: process.env.AZURE_KEY_VAULT_URI,
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  peerEducoreApiUrl: process.env.PEER_EDUCORE_API_URL || 'https://api.educore.mock/api',
  peerEducoreApiKey: process.env.PEER_EDUCORE_API_KEY || DEFAULT_PEER_API_KEY,
  partnerExposedApiKey: process.env.PARTNER_EXPOSED_API_KEY || DEFAULT_PARTNER_API_KEY,
  corsOrigins: parseCsv(process.env.CORS_ORIGINS),
  adminEmails: parseCsv(process.env.ADMIN_EMAILS).map((email) => email.toLowerCase()),
};

/**
 * Refuse to boot a production server with demo credentials or incomplete auth.
 * This runs after Key Vault initialization so secrets loaded from the vault count.
 */
export function validateProductionConfig(): void {
  if (config.nodeEnv !== 'production') return;

  const errors: string[] = [];

  if (!config.databaseUrl || config.databaseUrl === DEFAULT_DATABASE_URL || config.databaseUrl.includes('merch_secure_pass')) {
    errors.push('DATABASE_URL must use production database credentials');
  }
  if (!config.jwtSecret || config.jwtSecret === DEFAULT_JWT_SECRET || config.jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be a unique value of at least 32 characters');
  }
  if (!isConfiguredValue(config.azureClientId)) {
    errors.push('AZURE_CLIENT_ID must be configured');
  }
  if (!isConfiguredValue(config.azureTenantId)) {
    errors.push('AZURE_TENANT_ID must be configured');
  }
  if (!config.partnerExposedApiKey || config.partnerExposedApiKey === DEFAULT_PARTNER_API_KEY) {
    errors.push('PARTNER_EXPOSED_API_KEY must be replaced');
  }
  if (!config.peerEducoreApiKey || config.peerEducoreApiKey === DEFAULT_PEER_API_KEY) {
    errors.push('PEER_EDUCORE_API_KEY must be replaced');
  }
  if (config.corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS must list the permitted frontend origin(s)');
  }

  if (errors.length > 0) {
    throw new Error(`Unsafe production configuration:\n- ${errors.join('\n- ')}`);
  }
}

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
