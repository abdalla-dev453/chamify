/**
 * Design tokens matching the ChamaLedger / ACREAGE visual language:
 * emerald as the trust/money color, slate for structure, orange as the
 * energetic accent. Kept centralised here so no component hardcodes hex.
 */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: { 50: "#ecfdf5", 500: "#059669", 600: "#047857", 900: "#064e3b" },
          slate: { 50: "#f8fafc", 700: "#334155", 800: "#1e293b", 900: "#0f172a" },
          orange: { 400: "#fb923c", 500: "#ea580c", 600: "#c2410c" },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.25)",
      },
    },
  },
  plugins: [],
};