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
                    50: '#eef7ff',
                    100: '#d8ebff',
                    200: '#b7dbff',
                    300: '#8dc7ff',
                    400: '#5aa8f8',
                    500: '#2c8be8',
                    600: '#0f76d8',
                    700: '#0b62b4',
                    800: '#0e4f8b',
                    900: '#103f6d',
                },
                secondary: {
                    50: '#effcfd',
                    100: '#d2f4f7',
                    200: '#a9e8ee',
                    300: '#78d6e1',
                    400: '#45bfd0',
                    500: '#23a7bd',
                    600: '#19879e',
                    700: '#176d80',
                    800: '#185a69',
                    900: '#184c58',
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
