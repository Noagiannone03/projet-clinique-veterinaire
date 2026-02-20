/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#eef5fb',
                    100: '#d8e7f3',
                    200: '#b7d0e5',
                    300: '#8db3d3',
                    400: '#5f90bd',
                    500: '#356c9d',
                    600: '#0B2C4D',
                    700: '#08233d',
                    800: '#061b30',
                    900: '#031221',
                },
                secondary: {
                    50: '#f1fdf9',
                    100: '#dcf9f1',
                    200: '#bcf1e3',
                    300: '#9de9d6',
                    400: '#8ae5cf',
                    500: '#7FE1CB',
                    600: '#5bc8af',
                    700: '#3ea18b',
                    800: '#2f7d6d',
                    900: '#245f53',
                },
                accent: {
                    50: '#f7f2ff',
                    100: '#efe4ff',
                    200: '#ddc6ff',
                    300: '#c8a1ff',
                    400: '#ad76ff',
                    500: '#8f4fe8',
                    600: '#7633cf',
                    700: '#6128a9',
                    800: '#4f2188',
                    900: '#3f1b6b',
                },
                success: '#10b981',
                warning: '#f97316',
                danger: '#e11d48',
            },
            fontFamily: {
                sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            boxShadow: {
                card: '0 1px 2px rgba(15, 23, 42, 0.05), 0 8px 20px rgba(15, 23, 42, 0.04)',
                'card-hover': '0 1px 2px rgba(15, 23, 42, 0.05), 0 14px 32px rgba(15, 23, 42, 0.08)',
                modal: '0 30px 60px rgba(15, 23, 42, 0.18)',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
}
