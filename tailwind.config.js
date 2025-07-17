import typography from "@tailwindcss/typography";
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure this line is present and correct
  ],
  theme: {
    extend: {},
  },
  plugins: [typography],
};
