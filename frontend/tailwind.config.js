/**
 * Institutional design tokens for the ChamaLedger platform system core console.
 * Establishes flat, rigid deep-navy base surfaces, sharp slate geometric borders,
 * and high-contrast solar orange for numeric and status action parameters.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Strict system corporate grid palette (No legacy emerald paths permitted)
        brand: {
          // Dominant operational canvas and structured panel layers
          slate: {
            50: "#f8fafc",   // High-density utility text / metallic nodes
            800: "#1e293b",  // Active layout border lines
            900: "#0f172a",  // Tabular cell backing panels
            950: "#020617",  // Absolute platform root canvas background
          },
          // High-visibility numeric arrays and system validation tokens
          orange: {
            400: "#fb923c",  // Sub-metric highlights / hover text vectors
            500: "#f97316",  // Primary system tracking accent node
            600: "#ea580c",  // Destructive / heavy mutation warning bounds
          },
        },
      },
      fontFamily: {
        // Retained for generic non-tabular layout wrappers
        sans: ["Inter", "system-ui", "sans-serif"],
        // Enforced universally across metrics, tickers, and log registries
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      // Dropped soft backdropBlur keys to optimize terminal frame tracking
      backdropBlur: {},
      boxShadow: {
        // Replaced soft glass shadows with a dense, flat, geometric structural shadow array
        console: "0 4px 16px 0 rgba(2, 6, 23, 0.4)",
      },
    },
  },
  plugins: [],
};
