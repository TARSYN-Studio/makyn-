import type { ReactNode } from "react";

import type { Lang } from "@/lib/i18n";

export type ChoiceOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

/**
 * Server-rendered segmented control. Each option posts to its own server
 * action via a <form> with the value pre-filled — keeps the whole row
 * zero-JS and state-free on the client.
 */
export function ChoiceRow({
  lang,
  label,
  sub,
  value,
  options,
  action,
  fieldName
}: {
  lang: Lang;
  label: string;
  sub?: string;
  value: string;
  options: ChoiceOption[];
  action: (formData: FormData) => void | Promise<void>;
  fieldName: string;
}) {
  const isAr = lang === "ar";
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-4">
      <div className="min-w-0">
        <div
          className={`text-[13.5px] font-medium text-[var(--ink)] ${
            isAr ? "text-ar" : ""
          }`}
        >
          {label}
        </div>
        {sub && (
          <div
            className={`text-[12px] text-[var(--ink-60)] mt-0.5 ${
              isAr ? "text-ar" : ""
            }`}
          >
            {sub}
          </div>
        )}
      </div>
      <div className="flex-none inline-flex rounded-md border border-[var(--stone-light)] overflow-hidden bg-[var(--paper-low)] p-0.5">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <form action={action} key={opt.value}>
              <input type="hidden" name={fieldName} value={opt.value} />
              <button
                type="submit"
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-3 h-8 text-[12px] rounded transition-colors ${
                  active
                    ? "bg-[var(--ink)] text-[var(--paper)]"
                    : "text-[var(--ink-60)] hover:text-[var(--ink)] hover:bg-[var(--chrome-hover)]"
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
