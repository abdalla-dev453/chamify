/**
 * Applies a tenant's branding (Section 4 whitelabel fields: primary/secondary/
 * accent color, logo) as CSS custom properties, so a SACCO's custom domain
 * can visually diverge from the default deep-navy/slate/orange without
 * touching a single component.
 */
import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext(null);

// Defaults matching the Stitch-aligned light UI (see tailwind.config.js)
const BRAND_DEFAULTS = {
  primary: "#ffffff",  // brand-surface
  secondary: "#eef1f5", // brand-canvas
  accent: "#178a4a",    // brand-green-600
};

export function ThemeProvider({ tenant, children }) {
  useEffect(() => {
    const root = document.documentElement;

    const primary = tenant?.primary_color || BRAND_DEFAULTS.primary;
    const secondary = tenant?.secondary_color || BRAND_DEFAULTS.secondary;
    const accent = tenant?.accent_color || BRAND_DEFAULTS.accent;

    root.style.setProperty("--tenant-primary", primary);
    root.style.setProperty("--tenant-secondary", secondary);
    root.style.setProperty("--tenant-accent", accent);
  }, [tenant]);

  return <ThemeContext.Provider value={tenant}>{children}</ThemeContext.Provider>;
}

export function useTenantTheme() {
  return useContext(ThemeContext);
}