import type { ComponentChildren, JSX } from "preact";
import { cn } from "../../utils/cn.ts";

type ButtonVariant = "primary" | "ghost" | "danger" | "quiet";

export type ButtonProps = JSX.IntrinsicElements["button"] & {
  variant?: ButtonVariant;
  size?: "md" | "lg";
  children?: ComponentChildren;
};

export function Button({
  variant = "primary",
  size = "md",
  class: className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      class={cn("btn", `btn--${variant}`, `btn--${size}`, className)}
      {...rest}
    />
  );
}
