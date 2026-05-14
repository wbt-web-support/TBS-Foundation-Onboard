import Image from "next/image";
import { Icon } from "@/components/ui/Icon";

export function TransitionIntroScreen({
  title,
  description,
  checklist,
  imageSrc,
  imageAlt = "Section introduction illustration",
}: {
  title: string;
  description: string;
  checklist: string[];
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <div className="rounded-card border border-white/10 bg-intro-card p-6 shadow-2xl sm:p-7 lg:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white">{title}</h2>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-slate-200">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {checklist.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white"
              >
                <Icon name="check" className="size-3.5 text-emerald-400" />
                {item}
              </span>
            ))}
          </div>
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
