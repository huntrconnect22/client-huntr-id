import { forwardRef, type ComponentPropsWithoutRef } from "react";
import MuiButton from "@mui/material/Button";
import type { ButtonProps as MuiButtonProps } from "@mui/material/Button";

type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "color"> & {
  variant?: MuiButtonProps["variant"];
  color?: MuiButtonProps["color"];
};

/** Native form/ref contract keeps existing business forms working during migration. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { type = "submit", style, variant, ...props }, ref,
) {
  const gradient = props.className?.includes("bg-gradient") ||
    (typeof style?.background === "string" && style.background.includes("gradient("));
  const iconOnly = Boolean(props["aria-label"]);
  return (
    <MuiButton
      {...props}
      ref={ref}
      type={type}
      variant={variant ?? (iconOnly ? "text" : "outlined")}
      sx={iconOnly ? { minWidth: 40, p: 1 } : undefined}
      style={{
        ...style,
        borderRadius: style?.borderRadius === "50%" ? "50%" : 6,
        boxShadow: "none",
        backgroundImage: "none",
        ...(gradient
          ? { background: "var(--ui-primary)", color: "#fff" } : {}),
      }}
    />
  );
});
