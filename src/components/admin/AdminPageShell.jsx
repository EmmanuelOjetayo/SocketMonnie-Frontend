import { cn } from "@/utils/cn";

export function AdminPageShell({ className, children }) {
  return (
    <div className={cn("min-h-screen bg-[#dee3f9]/20 pb-28 font-sans text-[#090f24] md:pb-10", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function AdminHero({
  eyebrow,
  title,
  description,
  icon: Icon,
  actions,
  tone = "indigo",
  className,
}) {
  const tones = {
    indigo: "linear-gradient(135deg, #5B76E1 0%, #32417B 55%, #090f24 100%)",
    teal: "linear-gradient(135deg, #2FA4A9 0%, #1D5F73 55%, #0B2B3A 100%)",
    slate: "linear-gradient(135deg, #4B5563 0%, #1F2937 55%, #0B1220 100%)",
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 text-white shadow-md sm:p-5",
        className
      )}
      style={{ background: tones[tone] || tones.indigo }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {(eyebrow || Icon) && (
            <div className="mb-1 flex items-center gap-1.5 text-[#dee3f9]">
              {Icon ? <Icon className="size-4 text-emerald-300" /> : null}
              {eyebrow ? <span className="text-xs font-semibold">{eyebrow}</span> : null}
            </div>
          )}
          <h1 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-xs text-[#dee3f9]/85 sm:text-sm">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}

export default AdminPageShell;
