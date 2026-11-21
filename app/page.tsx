import Image from "next/image";

// Temporary first screen: it only proves the brand layer (colours, type, logo).
// It becomes the sign-in gate in the next phase.
export default function Home() {
  return (
    <main className="dark flex flex-1 flex-col items-center justify-center gap-10 bg-background px-6 text-foreground">
      <Image
        src="/brand/ambrace-lowercase-horizontal-reversed.svg"
        alt="Ambrace"
        width={220}
        height={56}
        priority
      />
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="label-mono text-muted-foreground">Foundation ready</p>
        <h1 className="text-4xl font-light tracking-tight">
          Say it out loud. See where you stand.
        </h1>
        <p className="text-muted-foreground">
          The voice engine is in place. Sign-in comes next.
        </p>
      </div>
    </main>
  );
}
