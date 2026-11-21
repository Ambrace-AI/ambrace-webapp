import { CheckIcon, CircleIcon } from "lucide-react";

import { PASSWORD_RULES } from "@/lib/auth/password";
import { cn } from "@/lib/utils";

/**
 * The password rules, ticking off as the student types. Showing the rules up
 * front is kinder than refusing a password afterwards and making them guess.
 * Each rule changes its icon as well as its colour.
 */
export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul
      className="grid grid-cols-2 gap-x-4 gap-y-1.5"
      aria-label="Password rules"
    >
      {PASSWORD_RULES.map((rule) => {
        const met = rule.passes(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              met ? "text-success" : "text-muted-foreground",
            )}
          >
            {met ? (
              <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <CircleIcon className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{met ? " (done)" : " (not yet)"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
