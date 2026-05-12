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
                    50: '#f4f6f3',
                    100: '#e5eae3',
                    200: '#ced9ca',
                    300: '#adbeaa',
                    400: '#8da685', // Sage Green
                    500: '#718a6a',
                    600: '#586b52',
                    700: '#42513e',
                    800: '#2d372a',
                    900: '#191e17',
                },
                secondary: {
                    50: '#f6f9f9',
                    100: '#edf3f2',
                    200: '#dae5e4',
                    300: '#aec3c1', // Blue-Grey
                    400: '#8da6a4',
                    500: '#6e8a88',
                    600: '#566b69',
                    700: '#40514f',
                    800: '#2c3736',
                    900: '#181e1d',
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
