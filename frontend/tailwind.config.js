/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"El Messiri"', 'serif'],
        body: ['Tajawal', 'sans-serif'],
        latin: ['"Cormorant Garamond"', 'serif'],
        sans: ['Tajawal', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "3xl": "1.5rem",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        blush: {
          50: "#FDF5F5",
          100: "#F9EAEA",
          200: "#F2D3D5",
          300: "#E8B2B5",
          400: "#D98F94",
          500: "#B76E79",
          600: "#A05A65",
          700: "#824751",
          800: "#63353D",
          900: "#45252A",
        },
        nude: {
          50: "#FAF6F1",
          100: "#F2EAE0",
          200: "#E6D5C3",
          300: "#D7BCA0",
          400: "#C6A17B",
          500: "#B48A61",
        },
        champagne: {
          50: "#FDF9F2",
          100: "#F7E7CE",
          200: "#EDD3A8",
          300: "#E0BB7E",
          400: "#D4AF37",
        },
        ink: {
          DEFAULT: "#2C2C2C",
          soft: "#595959",
          muted: "#8C8C8C",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-18px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "marquee-rtl": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.7s ease-out forwards",
        "float-slow": "float-slow 6s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        "marquee-rtl": "marquee-rtl 30s linear infinite",
      },
      boxShadow: {
        soft: "0 6px 30px -12px rgba(183, 110, 121, 0.18)",
        card: "0 4px 20px -6px rgba(44, 44, 44, 0.08)",
        glow: "0 0 40px -10px rgba(212, 175, 55, 0.45)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
