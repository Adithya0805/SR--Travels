"use client";

import Image from "next/image";
import { siteConfig } from "@/config/siteConfig";

export type LogoVariant = "icon" | "full" | "reversed";

interface LogoProps {
  /** Visual variant: 'icon' (monogram), 'full' (lockup), or 'reversed' (white + gold) */
  variant?: LogoVariant;
  /** Height in pixels (width auto-scales to preserve aspect ratio) */
  height?: number;
  /** Optional additional CSS classes */
  className?: string;
  /** Accessible image alt text override */
  alt?: string;
}

/**
 * `<Logo />` — SR Travels official brand logo component.
 * Supports:
 * - `icon`: Monogram only (1800x1000 aspect ratio 9:5)
 * - `full`: Full lockup with monogram + TRAVELS wordmark + gold accent lines (1800x1200 aspect ratio 3:2)
 * - `reversed`: White & gold lockup for dark backgrounds (slate-900 / dark themes)
 */
export default function Logo({
  variant = "full",
  height,
  className = "",
  alt,
}: LogoProps) {
  const altText = alt ?? `${siteConfig.businessName} Logo`;

  if (variant === "icon") {
    // 1800x1000 ratio = 1.8
    const h = height ?? 24;
    const w = Math.round(h * 1.8);
    return (
      <img
        src="/brand/logo-monogram.svg"
        alt={altText}
        width={w}
        height={h}
        className={`inline-block shrink-0 select-none object-contain ${className}`}
        style={{ height: `${h}px`, width: `${w}px` }}
      />
    );
  }

  if (variant === "reversed") {
    // 1800x1200 ratio = 1.5
    const h = height ?? 40;
    const w = Math.round(h * 1.5);
    return (
      <img
        src="/brand/logo-lockup-reversed.svg"
        alt={altText}
        width={w}
        height={h}
        className={`inline-block shrink-0 select-none object-contain ${className}`}
        style={{ height: `${h}px`, width: `${w}px` }}
      />
    );
  }

  // default: "full" lockup
  const h = height ?? 40;
  const w = Math.round(h * 1.5);
  return (
    <img
      src="/brand/logo-lockup.svg"
      alt={altText}
      width={w}
      height={h}
      className={`inline-block shrink-0 select-none object-contain ${className}`}
      style={{ height: `${h}px`, width: `${w}px` }}
    />
  );
}

export function LogoIcon(props: Omit<LogoProps, "variant">) {
  return <Logo variant="icon" {...props} />;
}

export function LogoFull(props: Omit<LogoProps, "variant">) {
  return <Logo variant="full" {...props} />;
}

export function LogoReversed(props: Omit<LogoProps, "variant">) {
  return <Logo variant="reversed" {...props} />;
}
