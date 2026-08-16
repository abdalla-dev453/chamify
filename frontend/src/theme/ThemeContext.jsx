/**
 * Applies a tenant's branding (Section 4 whitelabel fields: primary/secondary/
 * accent color, logo) as CSS custom properties, so a SACCO's custom domain
 * can visually diverge from the default deep-navy/slate/orange without
 * touching a single component.
 */
import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext(null);

// Strict system institutional defaults (No legacy emerald paths permitted)
const CORPORATE_DEFAULTS = {
  primary: "#020617",   // Deep Navy Slate Canvas (slate-950)
  secondary: "#0f172a", // Structured Layer Surface (slate-900)
  accent: "#f97316",    // High-Contrast Solar Action Node (orange-500)
};

export function ThemeProvider({ tenant, children }) {
  useEffect(() => {
    const root = document.documentElement;

    // Extract values or inject system flat-terminal architectural defaults
    let primary = tenant?.primary_color || CORPORATE_DEFAULTS.primary;
    let secondary = tenant?.secondary_color || CORPORATE_DEFAULTS.secondary;
    let accent = tenant?.accent_color || CORPORATE_DEFAULTS.accent;

    /**
     * Integrity Safeguard: System constraints explicitly prohibit green tones.
     * Overrides unauthorized legacy #059669 emerald variants if pushed by dirty database seeds.
     */
    if (primary.toLowerCase() === "#059669") primary = CORPORATE_DEFAULTS.primary;
    if (accent.toLowerCase() === "#059669") accent = CORPORATE_DEFAULTS.accent;

    // Apply strict key CSS variable registers
    root.style.setProperty("--tenant-primary", primary);
    root.style.setProperty("--tenant-secondary", secondary);
    root.style.setProperty("--tenant-accent", accent);
    
    // Explicit console logging tracking schema mutations
    console.log(`[System Theme Matrix] Node configuration compiled. Accent mapping: ${accent}`);
  }, [tenant]);

  return <ThemeContext.Provider value={tenant}>{children}</ThemeContext.Provider>;
}

export function useTenantTheme() {
  return useContext(ThemeContext);
}
