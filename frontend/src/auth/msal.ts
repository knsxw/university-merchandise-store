import { Configuration, PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID || '';
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID || '';

const isPlaceholder = (value: string) => !value || value.includes('here');

/**
 * True when a real Azure app registration is configured.
 * When false, the app falls back to the dev-only unverified login so the
 * project still runs end-to-end without an Entra ID tenant.
 */
export const isEntraConfigured = !isPlaceholder(clientId) && !isPlaceholder(tenantId);

export const msalConfig: Configuration = {
  auth: {
    // Placeholder GUID keeps the PublicClientApplication constructible in dev
    // mode; login is never attempted through it while unconfigured.
    clientId: isEntraConfigured ? clientId : '00000000-0000-0000-0000-000000000000',
    authority: `https://login.microsoftonline.com/${isEntraConfigured ? tenantId : 'organizations'}`,
    redirectUri: import.meta.env.VITE_AZURE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest = {
  scopes: ['User.Read'],
};
