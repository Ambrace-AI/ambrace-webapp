import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * The Ambrace logo, always from the supplied files and never redrawn.
 *
 * The product uses the lowercase wordmark: the logo kit describes it as the
 * softer, app-like version, and saves the capital one for formal surfaces.
 * `surface` says what the logo sits on, so the right colourway is chosen.
 */
export function Logo({
  surface,
  className,
  priority = false,
}: {
  surface: "ink" | "paper";
  className?: string;
  priority?: boolean;
}) {
  const file =
    surface === "ink"
      ? "/brand/ambrace-lowercase-horizontal-reversed.svg"
      : "/brand/ambrace-lowercase-horizontal.svg";

  return (
    <Image
      src={file}
      alt="Ambrace"
      width={148}
      height={38}
      priority={priority}
      // The kit's minimum width for the horizontal logo is 120px.
      className={cn("h-auto w-[148px]", className)}
    />
  );
}
