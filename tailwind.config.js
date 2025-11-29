/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                background: '#030712', // Gray 950 (Deep Space)
                surface: '#0f172a', // Slate 900
                // Mapping full scales for compatibility with existing code (e.g. primary-600)
                primary: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee', // Glow
                    500: '#06b6d4', // Base
                    600: '#0891b2', // Dim
                    700: '#0e7490',
                    800: '#155e75',
                    900: '#164e63',
                    950: '#083344',
                    DEFAULT: '#06b6d4',
                    glow: '#22d3ee',
                    dim: '#0891b2',
                },
                secondary: {
                    50: '#fdf4ff',
                    100: '#fae8ff',
                    200: '#f5d0fe',
                    300: '#f0abfc',
                    400: '#e879f9', // Glow
                    500: '#d946ef', // Base
                    600: '#c026d3', // Dim
                    700: '#a21caf',
                    800: '#86198f',
                    900: '#701a75',
                    950: '#4a044e',
                    DEFAULT: '#d946ef',
                    glow: '#e879f9',
                    dim: '#c026d3',
                },
                accent: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa', // Glow
                    500: '#8b5cf6', // Base
                    600: '#7c3aed',
                    700: '#6d28d9',
                    800: '#5b21b6',
                    900: '#4c1d95',
                    950: '#2e1065',
                    DEFAULT: '#8b5cf6',
                    glow: '#a78bfa',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'neon-blue': '0 0 10px theme("colors.primary.500"), 0 0 30px theme("colors.primary.600")',
                'neon-pink': '0 0 10px theme("colors.secondary.500"), 0 0 30px theme("colors.secondary.600")',
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
                    'from': { boxShadow: '0 0 10px -10px theme("colors.primary.400")' },
                    'to': { boxShadow: '0 0 20px 5px theme("colors.primary.400")' },
                }
            }
        },
    },
    plugins: [],
};
