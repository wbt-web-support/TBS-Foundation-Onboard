import Image from "next/image";
import { WbtMark } from "@/components/layout/WbtMark";

export function TransitionIntroScreen({
  title,
  description,
  checklist,
  closingText,
  imageSrc,
  imageAlt = "Section introduction illustration",
}: {
  title: string;
  description: string;
  checklist: string[];
  closingText?: string;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-6 shadow-lg sm:p-7 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-ink">{title}</h2>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-muted">{description}</p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {checklist.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-transparent px-3 py-1.5 text-sm font-medium text-ink"
              >
                <WbtMark className="h-4 w-[2.75rem] shrink-0" />
                {item}
              </span>
            ))}
          </div>
          {closingText ? (
            <p className="mt-5 text-[15px] leading-relaxed text-muted">{closingText}</p>
          ) : null}
        </div>
        {imageSrc ? (
          <div className="relative mx-auto flex w-full max-w-[140px] shrink-0 justify-center sm:max-w-[170px] lg:mx-0 lg:max-w-[190px]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={380}
              height={380}
              sizes="(min-width: 1024px) 190px, 170px"
              className="h-auto w-full object-contain drop-shadow-lg"
              priority
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
