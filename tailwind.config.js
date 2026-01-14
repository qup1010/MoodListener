/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                primary: "rgb(var(--color-primary) / <alpha-value>)",
                "primary-dark": "rgb(var(--color-primary-dark) / <alpha-value>)",
                "background-light": "#f8f7f6",
                "background-dark": "#1e1b14",
                "card-dark": "#28313D",
                "mood-positive": "#4ADE80",
                "mood-neutral": "#FACC15",
                "mood-negative": "#F87171",
                "mood-positive-soft": "#F5928C",
                "mood-neutral-soft": "#A2D9CE",
                "mood-negative-soft": "#6B4F5E",
                "mood-highlight": "#F2C46B"
            },
            fontFamily: {
                display: "Manrope, sans-serif"
            },
            boxShadow: {
                soft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
                glow: "0 0 15px rgba(53, 92, 95, 0.1)"
            }
        }
    },
    plugins: [],
}
