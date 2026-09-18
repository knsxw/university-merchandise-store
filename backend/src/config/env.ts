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
  openaiModel: string;
  weatherApiUrl: string;
  campusLatitude: number;
  campusLongitude: number;
  campusLocationName: string;
  partnerExposedApiKey: string;
  corsOrigins: string[];
  adminEmails: string[];
}

const DEFAULT_DATABASE_URL = 'mysql://root:merch_secure_pass@localhost:3306/merch_store';
const DEFAULT_JWT_SECRET = 'super_secret_jwt_signing_key_change_in_production';
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
  azureKeyVaultUri:
    process.env.KEY_VAULT_URL ||
    process.env.AZURE_KEY_VAULT_URI ||
    (process.env.AZURE_KEY_VAULT_NAME
      ? `https://${process.env.AZURE_KEY_VAULT_NAME}.vault.azure.net`
      : undefined),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  weatherApiUrl: process.env.WEATHER_API_URL || 'https://api.open-meteo.com/v1/forecast',
  campusLatitude: parseFloat(process.env.CAMPUS_LATITUDE || '13.6123'),
  campusLongitude: parseFloat(process.env.CAMPUS_LONGITUDE || '100.8373'),
  campusLocationName: process.env.CAMPUS_LOCATION_NAME || 'Assumption University, Suvarnabhumi Campus',
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
  if (config.corsOrigins.length === 0) {
    errors.push('CORS_ORIGINS must list the permitted frontend origin(s)');
  }

  if (errors.length > 0) {
    throw new Error(`Unsafe production configuration:\n- ${errors.join('\n- ')}`);
  }
}

type StringConfigKey =
  | 'jwtSecret'
  | 'partnerExposedApiKey';

const KEY_VAULT_SECRETS: ReadonlyArray<{
  vaultName: string;
  configKey: StringConfigKey;
  environmentName: string;
}> = [
  { vaultName: 'JWT-SECRET', configKey: 'jwtSecret', environmentName: 'JWT_SECRET' },
  { vaultName: 'PARTNER-EXPOSED-API-KEY', configKey: 'partnerExposedApiKey', environmentName: 'PARTNER_EXPOSED_API_KEY' },
];

let keyVaultInitialization: Promise<void> | undefined;

const isNotFoundError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 404;

async function loadKeyVaultSecrets(): Promise<void> {
  if (!config.azureKeyVaultUri) {
    console.log('ℹ️  Azure Key Vault URI not provided. Using environment variables.');
    return;
  }

  try {
    console.log(`🔐 Connecting to Azure Key Vault: ${config.azureKeyVaultUri}...`);
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(config.azureKeyVaultUri, credential);

    const loadedNames: string[] = [];
    const missingNames: string[] = [];

    await Promise.all(KEY_VAULT_SECRETS.map(async ({ vaultName, configKey, environmentName }) => {
      try {
        const secret = await secretClient.getSecret(vaultName);
        if (!secret.value) {
          missingNames.push(vaultName);
          return;
        }

        config[configKey] = secret.value;
        process.env[environmentName] = secret.value;
        loadedNames.push(vaultName);
      } catch (error) {
        if (isNotFoundError(error)) {
          missingNames.push(vaultName);
          return;
        }
        throw error;
      }
    }));

    console.log(`✅ Loaded ${loadedNames.length} secret(s) from Azure Key Vault: ${loadedNames.join(', ') || 'none'}.`);
    if (missingNames.length > 0) {
      console.warn(`⚠️  Key Vault secret(s) not found; existing environment values remain in use: ${missingNames.join(', ')}.`);
    }
  } catch (error) {
    const message = `Could not load secrets from Azure Key Vault: ${(error as Error).message}`;
    if (config.nodeEnv === 'production') {
      throw new Error(message, { cause: error });
    }
    console.warn(`⚠️  ${message}. Using local environment values because NODE_ENV is not production.`);
  }
}

/**
 * Loads application secrets once, before importing modules that initialize
 * database clients or request handlers.
 */
export function initializeKeyVaultSecrets(): Promise<void> {
  keyVaultInitialization ??= loadKeyVaultSecrets();
  return keyVaultInitialization;
}
