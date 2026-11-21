import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Orbit } from "@/components/brand/orbit";

/**
 * The frame around every signed-out screen.
 *
 * It is Ink (dark) on purpose. Before a student signs in the brand is all
 * there is to see, and dark is where it is most itself: calm, with a single
 * warm point. There is no Ember button on these screens. The only warm thing
 * is the student's dot in the mark, because the student has not arrived yet.
 *
 * On a phone the picture is dropped and the form comes first: the task
 * matters more than the scenery.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="dark grid min-h-dvh bg-background text-foreground lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden flex-col justify-between border-r border-border p-12 lg:flex">
        <Logo surface="ink" priority />
        <div className="flex flex-col gap-10">
          <Orbit className="w-56" />
          <div className="flex max-w-md flex-col gap-4">
            <p className="label-mono text-muted-foreground">
              Oral practice · Classes 5 to 12
            </p>
            <p className="font-heading text-5xl leading-[1.1] font-light tracking-tight">
              Say it out loud.
              <br />
              See where you stand.
            </p>
            <p className="text-muted-foreground">
              A patient examiner that listens, asks the next question, and shows
              you what to work on.
            </p>
          </div>
        </div>
        <p className="label-mono text-muted-foreground">ambrace.in</p>
      </aside>

      <main className="flex flex-col px-6 py-10 sm:px-10 lg:justify-center lg:px-16">
        <div className="mb-12 lg:hidden">
          <Logo surface="ink" priority />
        </div>
        <div className="animate-rise mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

/** The heading block shared by the signed-out screens. */
export function AuthHeading({
  title,
  description,
}: {
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="text-3xl font-light tracking-tight">{title}</h1>
      {description ? (
        <p className="text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
