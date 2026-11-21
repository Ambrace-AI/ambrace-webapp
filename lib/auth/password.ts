/**
 * The password rules of the Cognito user pool, shown to the student as a live
 * checklist so they never have to guess why a password was refused.
 *
 * Keep in step with `password_policy` in ambrace-backend/infra/app/cognito.tf.
 */

export type PasswordRule = {
  id: string;
  label: string;
  passes: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: "8+ characters",
    passes: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    passes: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    passes: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "A number",
    passes: (password) => /[0-9]/.test(password),
  },
];

export function isPasswordAcceptable(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.passes(password));
}

/** Deliberately loose: the email we send is the real check. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
