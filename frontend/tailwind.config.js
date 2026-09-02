/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores semánticos que shadcn/ui espera
        background: '#FAF3E7',
        foreground: '#2C3E50',
        card: '#FFFFFF',
        'card-foreground': '#2C3E50',
        popover: '#FFFFFF',
        'popover-foreground': '#2C3E50',
        primary: '#D97A2B',
        'primary-foreground': '#FFFFFF',
        secondary: '#2E8B57',
        'secondary-foreground': '#FFFFFF',
        muted: '#F3E9DA',
        'muted-foreground': '#6B7280',
        accent: '#C0392B',
        'accent-foreground': '#FFFFFF',
        destructive: '#C0392B',
        border: '#E5D7C1',
        input: '#E5D7C1',
        ring: '#D97A2B',
        // Paleta propia
        'esquina-cream': '#FAF3E7',
        'esquina-white': '#FFFFFF',
        'esquina-primary': '#D97A2B',
        'esquina-secondary': '#2E8B57',
        'esquina-accent': '#C0392B',
        'esquina-dark': '#2C3E50',
        'esquina-gray': '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Nunito', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
