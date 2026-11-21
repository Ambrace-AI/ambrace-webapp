import { describe, expect, test } from "vitest";

import { buildAuthConfig, missingAuthSettings } from "@/lib/auth/config";
import { describeAuthError } from "@/lib/auth/errors";
import {
  PASSWORD_RULES,
  isPasswordAcceptable,
  looksLikeEmail,
} from "@/lib/auth/password";

const ENVIRONMENT = {
  userPoolId: "ap-south-1_example",
  userPoolClientId: "client123",
  domain: "ambrace-dev.auth.ap-south-1.amazoncognito.com",
  appUrl: "http://localhost:3000",
};

describe("sign-in configuration", () => {
  test("uses the authorization code flow and returns to this app", () => {
    const cognito = buildAuthConfig(ENVIRONMENT).Auth?.Cognito;

    expect(cognito?.userPoolId).toBe("ap-south-1_example");
    expect(cognito?.userPoolClientId).toBe("client123");
    expect(cognito?.loginWith?.oauth).toMatchObject({
      domain: "ambrace-dev.auth.ap-south-1.amazoncognito.com",
      responseType: "code",
      redirectSignIn: ["http://localhost:3000/auth/callback"],
      redirectSignOut: ["http://localhost:3000/sign-in"],
    });
  });

  test("tolerates a pasted scheme, stray spaces and a trailing slash", () => {
    const oauth = buildAuthConfig({
      ...ENVIRONMENT,
      domain: " https://ambrace-dev.auth.ap-south-1.amazoncognito.com ",
      appUrl: "https://app-dev.ambrace.in/ ",
    }).Auth?.Cognito.loginWith?.oauth;

    expect(oauth?.domain).toBe("ambrace-dev.auth.ap-south-1.amazoncognito.com");
    expect(oauth?.redirectSignIn).toEqual([
      "https://app-dev.ambrace.in/auth/callback",
    ]);
  });

  test("names every missing setting instead of failing silently", () => {
    expect(missingAuthSettings({ ...ENVIRONMENT, domain: "  " })).toEqual([
      "NEXT_PUBLIC_COGNITO_DOMAIN",
    ]);
    expect(() => buildAuthConfig({})).toThrow(
      /NEXT_PUBLIC_COGNITO_USER_POOL_ID.*NEXT_PUBLIC_APP_URL/,
    );
  });
});

describe("sign-in error messages", () => {
  const named = (name: string, message = "") => ({ name, message });

  test("a wrong password and an unknown email read exactly the same", () => {
    const wrongPassword = describeAuthError(named("NotAuthorizedException"));
    const unknownEmail = describeAuthError(named("UserNotFoundException"));

    expect(wrongPassword.message).toBe(unknownEmail.message);
    expect(wrongPassword.message).not.toMatch(/exist|registered|no account/i);
  });

  test("an unconfirmed account is sent to enter its code", () => {
    expect(describeAuthError(named("UserNotConfirmedException")).action).toBe(
      "confirm-email",
    );
  });

  test("a rejected password explains the rules", () => {
    const fromPolicy = describeAuthError(
      named(
        "InvalidParameterException",
        "Password did not conform with policy",
      ),
    );
    expect(fromPolicy.message).toMatch(/8 characters/);
  });

  test("losing the connection is described as that, not as our fault", () => {
    expect(describeAuthError(new TypeError("Failed to fetch")).message).toMatch(
      /connection/,
    );
  });

  test("an unfamiliar error never shows the provider's own wording", () => {
    const problem = describeAuthError(
      named("InternalErrorException", "User pool client abc does not exist"),
    );
    expect(problem.message).not.toMatch(/pool|client|abc/);
  });

  test.each([null, undefined, "boom", 42])(
    "%j still produces a message",
    (thrown) => {
      expect(describeAuthError(thrown).message.length).toBeGreaterThan(0);
    },
  );
});

describe("password rules", () => {
  test("match the user pool policy: 8 characters with upper, lower and a number", () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual([
      "length",
      "uppercase",
      "lowercase",
      "number",
    ]);
    expect(isPasswordAcceptable("Abcdefg1")).toBe(true);
  });

  test.each(["Abcdef1", "abcdefg1", "ABCDEFG1", "Abcdefgh"])(
    "%s is refused",
    (password) => {
      expect(isPasswordAcceptable(password)).toBe(false);
    },
  );

  test("email check catches obvious slips without being strict", () => {
    expect(looksLikeEmail(" asha@example.com ")).toBe(true);
    expect(looksLikeEmail("asha@example")).toBe(false);
    expect(looksLikeEmail("asha example.com")).toBe(false);
    expect(looksLikeEmail("")).toBe(false);
  });
});
