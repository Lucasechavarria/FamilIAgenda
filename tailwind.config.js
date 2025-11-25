/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                background: '#030712', // Gray 950 (Deep Space)
                surface: '#0f172a', // Slate 900
                primary: {
                    DEFAULT: '#06b6d4', // Cyan 500
                    glow: '#22d3ee', // Cyan 400
                    dim: '#0891b2', // Cyan 600
                },
                secondary: {
                    DEFAULT: '#d946ef', // Fuchsia 500
                    glow: '#e879f9', // Fuchsia 400
                    dim: '#c026d3', // Fuchsia 600
                },
                accent: {
                    DEFAULT: '#8b5cf6', // Violet 500
                    glow: '#a78bfa', // Violet 400
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'neon-blue': '0 0 10px theme("colors.primary.DEFAULT"), 0 0 30px theme("colors.primary.dim")',
                'neon-pink': '0 0 10px theme("colors.secondary.DEFAULT"), 0 0 30px theme("colors.secondary.dim")',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.2)',
            },
            animation: {
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                glow: {
                    'from': { boxShadow: '0 0 10px -10px theme("colors.primary.glow")' },
                    'to': { boxShadow: '0 0 20px 5px theme("colors.primary.glow")' },
                }
            }
        },
    },
    plugins: [],
};
