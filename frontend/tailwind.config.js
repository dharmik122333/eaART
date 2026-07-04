/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0B0F', // Dark space black
        card: {
          DEFAULT: '#12121A', // Deep card gray
          hover: '#181824',   // Brighter card highlight
        },
        border: '#1F1F2E',    // Sleek border line
        primary: {
          DEFAULT: '#7C3AED', // Electric purple
          hover: '#9333EA',   // Lighter purple hover
          glow: '#C084FC',    // Glow accent purple
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'purple-glow': 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, rgba(11,11,15,0) 70%)',
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
