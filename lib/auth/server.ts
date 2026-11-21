import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { fetchAuthSession } from "aws-amplify/auth/server";
import type { NextRequest, NextResponse } from "next/server";

import {
  buildAuthConfig,
  missingAuthSettings,
  readAuthEnvironment,
} from "./config";

type ServerRunner = ReturnType<typeof createServerRunner>;

let runner: ServerRunner | null = null;

/** Built on first use so a missing setting cannot crash every request. */
function serverRunner(): ServerRunner | null {
  if (runner) return runner;
  const environment = readAuthEnvironment();
  if (missingAuthSettings(environment).length > 0) return null;
  runner = createServerRunner({ config: buildAuthConfig(environment) });
  return runner;
}

/**
 * Whether this request carries a valid session.
 *
 * The session cookies are checked on the server (signature and expiry), so a
 * made-up cookie does not count. Any failure means "not signed in": the gate
 * must never let someone through because a check broke.
 */
export async function hasValidSession(
  request: NextRequest,
  response: NextResponse,
): Promise<boolean> {
  const active = serverRunner();
  if (!active) return false;
  try {
    return await active.runWithAmplifyServerContext({
      nextServerContext: { request, response },
      operation: async (context) => {
        const session = await fetchAuthSession(context);
        return session.tokens?.accessToken !== undefined;
      },
    });
  } catch {
    return false;
  }
}
