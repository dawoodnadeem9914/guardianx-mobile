import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0b1220",
          light: "#111a2e",
          raised: "#161f38",
        },
        teal: {
          DEFAULT: "#14b8a6",
          strong: "#0d9488",
          soft: "#5eead4",
        },
        emergency: {
          DEFAULT: "#f43f5e",
          strong: "#e11d48",
        },
        safe: {
          DEFAULT: "#22c55e",
          strong: "#16a34a",
        },
      },
      fontSize: {
        "xxl": ["1.75rem", { lineHeight: "2.1rem", fontWeight: "700" }],
        "huge": ["2.25rem", { lineHeight: "2.6rem", fontWeight: "800" }],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
