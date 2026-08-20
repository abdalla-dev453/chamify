/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          // Flat references
          canvas: "#eef1f5", 
          surface: "#ffffff", 
          border: "#e2e8f0",
          
          // Missing component added to stop the compilation crash
          green: {
             100: "#d1fae5", // Soft background for successful badge states
    500: "#10b981", // Dynamic focus ring color boundary
    600: "#039252", // Main core interactive state button token
    700: "#027a44", // Main core interactive state button token
          },
          
          // Tailored nesting structures explicitly mapping keys
          navy: {
            50: "#f0f4f8",
            100: "#d9e2ec",
            200: "#bcccdc",
            500: "#102a43",
            600: "#0b69a3",
            700: "#035388",
          },
          ink: {
            800: "#1a1d23",
            900: "#0f1115",
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
