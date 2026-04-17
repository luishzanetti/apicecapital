import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "430px",
      },
    },
    extend: {
      fontFamily: {
        // Geist is the brand primary per BRAND-BOOK v2.0; Inter kept as fallback.
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display': ['2.5rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'title': ['1.75rem', { lineHeight: '1.2', fontWeight: '600', letterSpacing: '-0.01em' }],
        'headline': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        'micro': ['0.75rem', { lineHeight: '1.3', fontWeight: '500' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        apice: {
          /* --apice-gold is kept as a legacy token name but now holds emerald
           * per BRAND-BOOK v2.0. Gold/violet are expert-only accent colors. */
          gold: "hsl(var(--apice-gold))",
          "gold-soft": "hsl(var(--apice-gold-soft))",
          emerald: "hsl(var(--apice-emerald, 152 78% 37%))",
          "emerald-deep": "hsl(var(--apice-emerald-deep, 155 72% 21%))",
          "blue-glow": "hsl(var(--apice-blue-glow, 220 100% 60%))",
          success: "hsl(var(--apice-success))",
          warning: "hsl(var(--apice-warning))",
          surface: "hsl(var(--apice-surface))",
          "surface-elevated": "hsl(var(--apice-surface-elevated))",
          "neon-blue": "hsl(var(--apice-neon-blue, 222 100% 68%))",
          "neon-purple": "hsl(var(--apice-neon-purple, 265 90% 68%))",
          "neon-cyan": "hsl(var(--apice-neon-cyan, 190 95% 60%))",
          profit: "hsl(var(--apice-profit, 152 69% 50%))",
          loss: "hsl(var(--apice-loss, 0 75% 58%))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 16px)",
      },
      spacing: {
        'safe-bottom': 'max(1rem, env(safe-area-inset-bottom))',
        'safe-top': 'max(1rem, env(safe-area-inset-top))',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", filter: "blur(20px)" },
          "50%": { opacity: "1", filter: "blur(24px)" },
        },
        "celebration": {
          "0%": { transform: "scale(1)" },
          "15%": { transform: "scale(1.15)" },
          "30%": { transform: "scale(0.95)" },
          "45%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "count-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "fade-up": "fade-up 0.4s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "celebration": "celebration 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "count-up": "count-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
