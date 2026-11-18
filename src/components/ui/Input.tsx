import type { JSX } from "preact";
import { useId } from "preact/hooks";
import { cn } from "../../utils/cn.ts";

export type InputProps = JSX.IntrinsicElements["input"] & {
  label: string;
  suffix?: string;
};

export function Input({ label, suffix, class: className, id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <label class={cn("field", className)} for={inputId}>
      <span class="field__label">{label}</span>
      <span class="field__control">
        <input id={inputId} class="field__input" {...rest} />
        {suffix && <span class="field__suffix">{suffix}</span>}
      </span>
    </label>
  );
}
