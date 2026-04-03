// Type-safe environment variable loading.
// Throws at startup if required server-side vars are missing.

function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

function bool(key: string, fallback = false): boolean {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === "true" || val === "1";
}

export const env = {
  // Mock flags
  dvsaMock: bool("DVSA_MOCK", true),
  dvlaMock: bool("DVLA_MOCK", true),
  aiEnabled: bool("AI_ENABLED", false),

  // DVSA (only required when not mocked)
  dvsa: {
    clientId: optional("DVSA_CLIENT_ID"),
    clientSecret: optional("DVSA_CLIENT_SECRET"),
    apiKey: optional("DVSA_API_KEY"),
    tokenUrl: optional(
      "DVSA_TOKEN_URL",
      "https://login.microsoftonline.com/a455b827-244d-4b55-96b5-3b60ce3c4a12/oauth2/v2.0/token"
    ),
    scope: optional("DVSA_SCOPE", "https://tapi.dvsa.gov.uk/.default"),
    baseUrl: optional("DVSA_BASE_URL", "https://history.mot.api.gov.uk"),
  },

  // DVLA
  dvla: {
    apiKey: optional("DVLA_API_KEY"),
    baseUrl: optional(
      "DVLA_BASE_URL",
      "https://driver-vehicle-licensing.api.gov.uk"
    ),
  },

  // Anthropic
  anthropic: {
    apiKey: optional("ANTHROPIC_API_KEY"),
  },
} as const;
