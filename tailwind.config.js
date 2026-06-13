/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Noto Serif JP"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        zen: {
          primary: '#2d3436',
          secondary: '#636e72',
          accent: '#c8b6a6',
          background: '#fefefe',
          surface: '#f8f6f4',
          text: '#2d3436',
        },
      },
      borderRadius: {
        'zen': '2px',
      },
      borderWidth: {
        'zen': '1px',
      },
      boxShadow: {
        'zen': '0px 2px 0px 0px rgba(0,0,0,0.06)',
        'zen-md': '0px 2px 0px 0px rgba(0,0,0,0.1)',
        'zen-lg': '0px 4px 0px 0px rgba(0,0,0,0.08)',
      },
      animation: {
        "meteor-effect": "meteor 5s linear infinite",
        spotlight: "spotlight 2s ease .75s 1 forwards",
        "border-beam": "border-beam calc(var(--duration)*1s) infinite linear",
      },
      keyframes: {
        "border-beam": {
          "100%": {
            "offset-distance": "100%",
          },
        },
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: 1 },
          "70%": { opacity: 1 },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: 0,
          },
        },
        spotlight: {
          "0%": {
            opacity: 0,
            transform: "translate(-72%, -62%) scale(0.5)",
          },
          "100%": {
            opacity: 1,
            transform: "translate(-50%,-40%) scale(1)",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
