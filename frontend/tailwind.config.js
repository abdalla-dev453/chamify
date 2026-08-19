/**
 * Design tokens for the Chamify UI — aligned to the Google Stitch reference
 * screens: light neutral surfaces, a single confident green for primary
 * actions and active states, black for secondary "quick" actions, and
 * plenty of whitespace inside soft-cornered white cards.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Neutral app canvas + card surfaces
          canvas: "#eef1f5", // page background
          surface: "#ffffff", // card background
          border: "#e2e8f0", // hairline card/table borders
          // Primary action / active-state green (chama, savings, M-Pesa)
          green: {
            50: "#ecfdf3",
            100: "#d3f8df",
            200: "#a6efc1",
            500: "#22a55a",
            600: "#178a4a",
            700: "#106b39",
          },
          // Secondary "quick action" black
          ink: {
            900: "#0f1115",
            800: "#1a1d23",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 6px -1px rgba(15, 23, 42, 0.06)",
        panel: "0 8px 24px -4px rgba(15, 23, 42, 0.10)",
      },
    },
  },
  plugins: [],
};