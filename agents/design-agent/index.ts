import { agent, tool } from "@21st-sdk/agent"
import { z } from "zod"

export default agent({
  model: "claude-sonnet-4-6",
  systemPrompt: `You are APEX, Apice Capital's Design System Agent.
You are an expert UI/UX designer specializing in premium fintech and crypto investment apps.

## Design Philosophy
- Premium dark-first aesthetic with glassmorphism and neon accents
- Semi-transparent layered UI (frosted glass cards, blurred backgrounds)
- Subtle micro-animations for delight without distraction
- Mobile-first responsive design (PWA targeting iOS/Android)
- Accessibility-first: WCAG 2.1 AA compliant

## Tech Stack
- React 18 + TypeScript + Vite
- Tailwind CSS 3.4 with custom design tokens
- shadcn/ui (Radix primitives) — 51 components
- Framer Motion for animations
- Inter font family

## Design System Tokens (CSS Variables)
- Primary: Blue (222, 89%, 55-60%)
- Accent/Gold: Amber (45, 93%, 47-52%)
- Success: Green (152, 69%, 40-45%)
- Glassmorphism: backdrop-blur(20-28px) + saturate(160-180%) + bg-opacity(0.75-0.85)
- 3 glass levels: light (12px blur), medium (20px blur), heavy (28px blur)
- Shadows: soft, gold, card, elevated
- Glows: primary, gold, success

## Brand Identity
- Apice Capital = Premium crypto DCA investment platform
- Target: English-speaking investors (EN-first, then ES)
- Tone: Trustworthy, intelligent, premium but accessible
- Competitors to beat: Coinbase, Robinhood, Revolut, Acorns

## Your Capabilities
1. Generate Tailwind CSS component styles
2. Create glassmorphism and visual effect specifications
3. Design responsive layouts (mobile-first)
4. Specify animation sequences and micro-interactions
5. Audit existing components for design consistency
6. Propose color palettes and visual hierarchies

Always output production-ready Tailwind CSS classes and React/TSX code.
Prefer utility classes over custom CSS when possible.
Follow the existing design token system in index.css.`,

  tools: {
    generateGlassStyle: tool({
      description: "Generate glassmorphism style specification for a UI element with specific blur level, opacity, and border treatment",
      inputSchema: z.object({
        element: z.string().describe("UI element type: card, nav, modal, sheet, popover, overlay"),
        level: z.enum(["light", "medium", "heavy"]).describe("Glass intensity level"),
        hasGlow: z.boolean().default(false).describe("Whether to add glow effect"),
        glowColor: z.enum(["primary", "gold", "success"]).optional().describe("Glow color if hasGlow is true"),
      }),
      execute: async ({ element, level, hasGlow, glowColor }) => {
        const blurMap = { light: 12, medium: 20, heavy: 28 }
        const opacityMap = { light: 0.6, medium: 0.75, heavy: 0.85 }
        const saturateMap = { light: 140, medium: 160, heavy: 180 }

        const blur = blurMap[level]
        const opacity = opacityMap[level]
        const saturate = saturateMap[level]

        let classes = `backdrop-blur-[${blur}px] backdrop-saturate-[${saturate}%] bg-card/${Math.round(opacity * 100)} border border-border/50`

        if (element === "nav") classes += " sticky top-0 z-50"
        if (element === "modal") classes += " rounded-2xl shadow-2xl"
        if (element === "card") classes += " rounded-xl"
        if (element === "sheet") classes += " rounded-t-2xl"
        if (element === "overlay") classes += " fixed inset-0 z-40"

        if (hasGlow && glowColor) {
          const glowClasses: Record<string, string> = {
            primary: "shadow-[0_0_20px_hsl(222_89%_55%/0.25)]",
            gold: "shadow-[0_0_20px_hsl(45_93%_52%/0.3)]",
            success: "shadow-[0_0_16px_hsl(152_69%_45%/0.25)]",
          }
          classes += ` ${glowClasses[glowColor]}`
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              element,
              level,
              tailwindClasses: classes,
              cssProperties: {
                backdropFilter: `blur(${blur}px) saturate(${saturate}%)`,
                background: `hsl(var(--card) / ${opacity})`,
                border: "1px solid hsl(var(--border) / 0.5)",
              },
            }, null, 2),
          }],
        }
      },
    }),

    generateAnimation: tool({
      description: "Generate animation specification for micro-interactions",
      inputSchema: z.object({
        type: z.enum([
          "entrance", "exit", "hover", "press", "loading",
          "success", "error", "transition", "attention"
        ]).describe("Animation type"),
        element: z.string().describe("What element is being animated"),
        duration: z.enum(["fast", "normal", "slow"]).default("normal"),
        easing: z.enum(["ease-out", "spring", "bounce", "linear"]).default("ease-out"),
      }),
      execute: async ({ type, element, duration, easing }) => {
        const durationMap = { fast: "150ms", normal: "300ms", slow: "500ms" }
        const easingMap = {
          "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
          spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
          linear: "linear",
        }

        const animations: Record<string, { keyframes: string; classes: string }> = {
          entrance: { keyframes: "fade-up", classes: "animate-fade-up opacity-0" },
          exit: { keyframes: "fade-down", classes: "animate-fade-down" },
          hover: { keyframes: "none", classes: "hover:scale-[1.02] hover:shadow-lg transition-all" },
          press: { keyframes: "none", classes: "active:scale-[0.97] transition-transform duration-100" },
          loading: { keyframes: "shimmer", classes: "animate-shimmer" },
          success: { keyframes: "scale-spring", classes: "animate-scale-spring" },
          error: { keyframes: "none", classes: "animate-shake" },
          transition: { keyframes: "fade-in", classes: "animate-fade-in" },
          attention: { keyframes: "pulse-ring", classes: "animate-pulse-ring" },
        }

        const anim = animations[type] || animations.entrance

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              type,
              element,
              tailwindClasses: anim.classes,
              keyframe: anim.keyframes,
              duration: durationMap[duration],
              easing: easingMap[easing],
              framerMotion: {
                initial: type === "entrance" ? { opacity: 0, y: 12 } : undefined,
                animate: type === "entrance" ? { opacity: 1, y: 0 } : undefined,
                transition: { duration: parseInt(durationMap[duration]) / 1000, ease: [0.22, 1, 0.36, 1] },
              },
            }, null, 2),
          }],
        }
      },
    }),

    auditComponent: tool({
      description: "Audit a component's design for consistency with the Apice design system",
      inputSchema: z.object({
        componentCode: z.string().describe("The React component TSX code to audit"),
        componentName: z.string().describe("Name of the component"),
      }),
      execute: async ({ componentCode, componentName }) => {
        const issues: string[] = []
        const suggestions: string[] = []

        // Check for hardcoded colors
        if (/(?:bg|text|border)-(?:gray|blue|green|red|yellow|white|black)-\d+/.test(componentCode)) {
          issues.push("Uses hardcoded Tailwind colors instead of design tokens (--primary, --accent, etc.)")
        }

        // Check for glassmorphism usage
        if (!componentCode.includes("backdrop-blur") && !componentCode.includes("glass-card") && !componentCode.includes("apice-glass")) {
          suggestions.push("Consider adding glassmorphism for premium feel (glass-card or apice-glass class)")
        }

        // Check for animations
        if (!componentCode.includes("animate-") && !componentCode.includes("motion") && !componentCode.includes("transition")) {
          suggestions.push("No animations detected. Add entrance animations (animate-fade-up) or hover states for better UX")
        }

        // Check for press feedback
        if (componentCode.includes("onClick") && !componentCode.includes("press-scale") && !componentCode.includes("active:scale")) {
          suggestions.push("Interactive element missing press feedback. Add press-scale or active:scale-[0.97]")
        }

        // Check for dark mode
        if (!componentCode.includes("dark:")) {
          suggestions.push("No dark mode variants detected. Ensure component works in dark theme")
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              component: componentName,
              score: Math.max(0, 100 - issues.length * 20 - suggestions.length * 10),
              issues,
              suggestions,
              status: issues.length === 0 ? "PASS" : "NEEDS_WORK",
            }, null, 2),
          }],
        }
      },
    }),

    generateColorPalette: tool({
      description: "Generate a color palette variation for a specific UI context",
      inputSchema: z.object({
        context: z.enum([
          "profit", "loss", "neutral", "premium", "warning",
          "info", "celebration", "regime-bull", "regime-bear", "regime-sideways"
        ]).describe("UI context for the palette"),
      }),
      execute: async ({ context }) => {
        const palettes: Record<string, { primary: string; bg: string; text: string; glow: string; label: string }> = {
          profit: { primary: "hsl(152 69% 45%)", bg: "hsl(152 69% 45% / 0.12)", text: "hsl(152 69% 60%)", glow: "hsl(152 69% 45% / 0.25)", label: "Success Green" },
          loss: { primary: "hsl(0 84% 60%)", bg: "hsl(0 84% 60% / 0.12)", text: "hsl(0 84% 70%)", glow: "hsl(0 84% 60% / 0.2)", label: "Destructive Red" },
          neutral: { primary: "hsl(215 20% 65%)", bg: "hsl(215 20% 65% / 0.10)", text: "hsl(215 20% 75%)", glow: "none", label: "Muted Gray" },
          premium: { primary: "hsl(45 93% 52%)", bg: "hsl(45 93% 52% / 0.12)", text: "hsl(45 93% 65%)", glow: "hsl(45 93% 52% / 0.3)", label: "Apice Gold" },
          warning: { primary: "hsl(38 92% 50%)", bg: "hsl(38 92% 50% / 0.12)", text: "hsl(38 92% 65%)", glow: "hsl(38 92% 50% / 0.2)", label: "Warning Amber" },
          info: { primary: "hsl(222 89% 60%)", bg: "hsl(222 89% 60% / 0.12)", text: "hsl(222 89% 72%)", glow: "hsl(222 89% 60% / 0.25)", label: "Primary Blue" },
          celebration: { primary: "hsl(280 80% 60%)", bg: "hsl(280 80% 60% / 0.12)", text: "hsl(280 80% 72%)", glow: "hsl(280 80% 60% / 0.3)", label: "Celebration Purple" },
          "regime-bull": { primary: "hsl(152 69% 50%)", bg: "hsl(152 69% 50% / 0.15)", text: "hsl(152 69% 65%)", glow: "hsl(152 69% 50% / 0.3)", label: "Bull Market Green" },
          "regime-bear": { primary: "hsl(0 70% 55%)", bg: "hsl(0 70% 55% / 0.15)", text: "hsl(0 70% 68%)", glow: "hsl(0 70% 55% / 0.25)", label: "Bear Market Red" },
          "regime-sideways": { primary: "hsl(45 60% 55%)", bg: "hsl(45 60% 55% / 0.12)", text: "hsl(45 60% 68%)", glow: "hsl(45 60% 55% / 0.2)", label: "Sideways Amber" },
        }

        const palette = palettes[context]

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ context, ...palette }, null, 2),
          }],
        }
      },
    }),
  },
})
