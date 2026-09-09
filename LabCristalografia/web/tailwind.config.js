/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta baseada no Logo UFMS
        ufms: {
          gold: "#C9A227",       // O Dourado do logo
          goldLight: "#EUC845",  // Um dourado mais claro para brilho
          carbon: "#0E1117",     // Fundo escuro profundo
          surface: "#161920",    // Fundo dos cards (levemente mais claro)
          text: "#FAFAFA",       // Branco off-white
          muted: "#888888"       // Cinza para textos secundários
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Fonte moderna
      }
    },
  },
  plugins: [],
}