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
  const className = props.className ?? "";
  const authPrimary = className.includes("auth-btn--primary");
  const authSuccess = className.includes("auth-btn--success");
  const gradient = className.includes("bg-gradient") || authPrimary || authSuccess ||
    (typeof style?.background === "string" && style.background.includes("gradient("));
  const solidBackground = [
    ["bg-orange-", "var(--ui-primary)"],
    ["bg-amber-", "#b45309"],
    ["bg-emerald-", "#187b45"],
    ["bg-teal-", "#0f766e"],
    ["bg-blue-", "#1565c0"],
    ["bg-indigo-", "#4f46e5"],
    ["bg-red-", "#c62828"],
  ].find(([prefix]) => className.includes(prefix))?.[1];
  const tokenBackground = className.match(/bg-\[var\((--ui-[^)]+)\)\]/)?.[1];
  const hasExplicitFill = Boolean(gradient || solidBackground || tokenBackground);
  const iconOnly = Boolean(props["aria-label"]) && !props.children;
  return (
    <MuiButton
      {...props}
      ref={ref}
      type={type}
      // Visual intent stays with each call site: navigation, tabs and cards
      // remain neutral by default; only explicit primary actions are filled.
      variant={variant ?? "text"}
      sx={iconOnly ? { minWidth: 40, p: 1 } : { "&:hover": { boxShadow: "none" } }}
      style={{
        ...style,
        borderRadius: style?.borderRadius === "50%" ? "50%" : 6,
        boxShadow: "none",
        backgroundImage: "none",
        ...(gradient || solidBackground
          ? { background: authSuccess ? "#187b45" : "var(--ui-primary)", color: "#fff" } : {}),
        ...(solidBackground && !gradient ? { background: solidBackground, color: "#fff" } : {}),
        ...(tokenBackground && !gradient && !solidBackground ? { backgroundColor: `var(${tokenBackground})` } : {}),
        // A text button remains a text button. Only an explicit `bg-*` class
        // becomes an inline style so MUI cannot reset it to transparent.
        ...(hasExplicitFill ? { borderColor: "transparent" } : {}),
      }}
    />
  );
});
