import type { ResourcesConfig } from "aws-amplify";

import { AUTH_CALLBACK_PATH, SIGN_IN_PATH } from "./routes";

/**
 * Where sign-in lives. These are public identifiers, not secrets: a Cognito
 * app client for a browser has no secret, and the pool only accepts the
 * redirect addresses registered for it.
 */
export type AuthEnvironment = {
  userPoolId: string;
  userPoolClientId: string;
  /** Host of the Cognito sign-in domain, without "https://". */
  domain: string;
  /** Origin this app is served from, e.g. http://localhost:3000. */
  appUrl: string;
};

/**
 * Next.js only inlines `process.env.NEXT_PUBLIC_*` when each variable is
 * written out in full, so they are read one by one rather than in a loop.
 */
export function readAuthEnvironment(): Partial<AuthEnvironment> {
  return {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  };
}

const VARIABLE_NAMES: Record<keyof AuthEnvironment, string> = {
  userPoolId: "NEXT_PUBLIC_COGNITO_USER_POOL_ID",
  userPoolClientId: "NEXT_PUBLIC_COGNITO_CLIENT_ID",
  domain: "NEXT_PUBLIC_COGNITO_DOMAIN",
  appUrl: "NEXT_PUBLIC_APP_URL",
};

/** Names of the settings that are missing or blank. Empty means ready. */
export function missingAuthSettings(
  environment: Partial<AuthEnvironment>,
): string[] {
  return (Object.keys(VARIABLE_NAMES) as Array<keyof AuthEnvironment>)
    .filter((key) => !environment[key]?.trim())
    .map((key) => VARIABLE_NAMES[key]);
}

function stripTrailingSlash(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * The Amplify configuration for our Cognito user pool.
 *
 * Fails loudly when a setting is missing: a half-configured sign-in page that
 * silently does nothing is far harder to diagnose than an error naming the
 * variable.
 */
export function buildAuthConfig(
  environment: Partial<AuthEnvironment>,
): ResourcesConfig {
  const missing = missingAuthSettings(environment);
  if (missing.length > 0) {
    throw new Error(
      `Sign-in is not configured. Set ${missing.join(", ")} in .env.local.`,
    );
  }
  const { userPoolId, userPoolClientId, domain, appUrl } =
    environment as AuthEnvironment;
  const origin = stripTrailingSlash(appUrl);

  return {
    Auth: {
      Cognito: {
        userPoolId: userPoolId.trim(),
        userPoolClientId: userPoolClientId.trim(),
        loginWith: {
          email: true,
          oauth: {
            domain: domain.trim().replace(/^https?:\/\//, ""),
            // Authorization code with PKCE. The implicit flow would put
            // tokens in the address bar.
            responseType: "code",
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [`${origin}${AUTH_CALLBACK_PATH}`],
            redirectSignOut: [`${origin}${SIGN_IN_PATH}`],
          },
        },
      },
    },
  };
}
