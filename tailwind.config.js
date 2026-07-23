/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // We will tie these to the tenant's brand colors later
        brand: {
          primary: "var(--color-primary, #0f172a)",
          secondary: "var(--color-secondary, #f8fafc)",
        },
      },
    },
  },
  plugins: [],
};
