import Image from "next/image";

export function IntroScreen({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6">
      <p className="rounded-lg bg-intro-badge px-4 py-2.5 text-center text-[11px] font-semibold uppercase leading-snug tracking-wide text-white shadow-sm sm:px-5 sm:text-xs">
        Complete with as much detail as possible
      </p>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-10">
          <div className="min-w-0 flex-1">
            <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              {heading}
            </h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">{body}</p>
          </div>
          <div className="relative mx-auto flex w-full max-w-[160px] shrink-0 justify-center sm:max-w-[180px] lg:mx-0 lg:max-w-[200px]">
            <Image
              src="/questionare.png"
              alt="Questionnaire and checklist illustration"
              width={400}
              height={400}
              sizes="(min-width: 1024px) 200px, 180px"
              className="h-auto w-full object-contain drop-shadow-lg"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
