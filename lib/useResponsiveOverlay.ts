"use client";

import { Grid } from "antd";

/**
 * Shared responsive widths for Ant Design Drawer / Modal.
 * Prefers the requested desktop size, but clamps on tablet/phone.
 */
export function useResponsiveDrawerWidth(preferred = 720): number | string {
  const screens = Grid.useBreakpoint();
  if (!screens.md) return "100%";
  if (!screens.lg) return Math.min(preferred, 560);
  if (!screens.xl) return Math.min(preferred, 720);
  return preferred;
}

export function useResponsiveModalWidth(preferred = 680): number | string {
  const screens = Grid.useBreakpoint();
  if (!screens.sm) return "calc(100vw - 24px)";
  if (!screens.md) return Math.min(preferred, 560);
  if (!screens.lg) return Math.min(preferred, 720);
  return preferred;
}

/** Safe style to pair with fixed Modal width props. */
export const responsiveModalStyle = {
  maxWidth: "calc(100vw - 24px)",
  top: 24,
} as const;
