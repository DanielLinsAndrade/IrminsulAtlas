import React from "react";

export type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold"
  | "purple";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  className = "",
  ...rest
}) => {
  const classNames = [
    "badge",
    `badge--${variant}`,
    `badge--${size}`,
    className,
  ].filter(Boolean).join(" ");

  return (
    <span className={classNames} {...rest}>
      {children}
    </span>
  );
};