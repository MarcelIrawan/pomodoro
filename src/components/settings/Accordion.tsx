// Accordion section for SettingsScreen (F16/F17): accessible expand/collapse.
import type { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import { cn } from "../../utils/cn.ts";
import { IconChevronDown } from "../ui/Icons.tsx";

export interface AccordionProps {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ComponentChildren;
}

export function Accordion({ title, subtitle, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `accordion-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section class="accordion">
      <button
        class="accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span class="accordion__heading">
          <span class="accordion__title">{title}</span>
          {subtitle && <span class="accordion__subtitle">{subtitle}</span>}
        </span>
        <IconChevronDown
          size={18}
          class={cn("accordion__chevron", open && "accordion__chevron--open")}
        />
      </button>
      {open && (
        <div id={panelId} class="accordion__panel" role="region" aria-label={title}>
          {children}
        </div>
      )}
    </section>
  );
}
