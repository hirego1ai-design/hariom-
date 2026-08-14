import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ══════════════════════════════════════════════════════════
         STITCH DESIGN DNA — Colors (all reference CSS variables)
         html.dark / html.light switch vars → Tailwind picks up
         ══════════════════════════════════════════════════════════ */
      colors: {
        /* Brand — Candidate (Red) */
        "primary":              "var(--primary)",
        "primary-dim":          "var(--primary-dim)",
        "primary-container":    "var(--primary-container)",
        "on-primary":           "var(--on-primary)",
        "on-primary-container": "var(--on-primary-container)",

        /* Brand — Employer (Blue) */
        "secondary":              "var(--secondary)",
        "secondary-dim":          "var(--secondary-dim)",
        "secondary-container":    "var(--secondary-container)",
        "on-secondary":           "var(--on-secondary)",
        "on-secondary-container": "var(--on-secondary-container)",

        /* Tertiary */
        "tertiary":              "var(--tertiary)",
        "tertiary-container":    "var(--tertiary-container)",
        "on-tertiary":           "var(--on-tertiary)",
        "on-tertiary-container": "var(--on-tertiary-container)",

        /* Backgrounds */
        "bg-page":     "var(--bg-page)",
        "bg-card":     "var(--bg-card)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-subtle":   "var(--bg-subtle)",
        "bg-input":    "var(--bg-input)",

        /* Surfaces */
        "surface":                    "var(--surface)",
        "surface-dim":                "var(--surface-dim)",
        "surface-bright":             "var(--surface-bright)",
        "surface-container-lowest":   "var(--surface-container-lowest)",
        "surface-container-low":      "var(--surface-container-low)",
        "surface-container":          "var(--surface-container)",
        "surface-container-high":     "var(--surface-container-high)",
        "surface-container-highest":  "var(--surface-container-highest)",

        /* Text */
        "text-primary":   "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted":     "var(--text-muted)",
        "text-inverse":   "var(--text-inverse)",
        "on-surface":     "var(--on-surface)",

        /* Outline */
        "outline":         "var(--outline)",
        "outline-variant": "var(--outline-variant)",

        /* Semantic */
        "green":       "#34A853",
        "yellow":      "#FBBC04",
        "gold":        "#FBBC04",
        "red-light":   "#E53935",
        "red-deep":    "#9B1B18",
        "chat-blue":   "#4285F4",
        "error":       "var(--color-error)",
      },

      /* ── Border Radius ────────────────────────────────────── */
      borderRadius: {
        xs:     "var(--radius-xs)",
        sm:     "var(--radius-sm)",
        md:     "var(--radius-md)",
        lg:     "var(--radius-lg)",
        xl:     "var(--radius-xl)",
        "2xl":  "var(--radius-2xl)",
        card:   "var(--radius-card)",
        button: "var(--radius-button)",
        input:  "var(--radius-input)",
        full:   "9999px",
      },

      /* ── Spacing Tokens ───────────────────────────────────── */
      spacing: {
        "stack-sm":       "8px",
        "stack-md":       "12px",
        "stack-lg":       "24px",
        "stack-xl":       "40px",
        "gutter":         "24px",
        "margin-mobile":  "16px",
        "margin-desktop": "32px",
      },

      /* ── Max Width ────────────────────────────────────────── */
      maxWidth: {
        "content":   "960px",
        "container": "1280px",
      },

      /* ── Font Families ────────────────────────────────────── */
      fontFamily: {
        /* Primitive names */
        sans:    ["DM Sans", "Plus Jakarta Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
        mono:    ["JetBrains Mono", "monospace"],

        /* Scale aliases (match utility class names used in pages) */
        "display-xl": ["Syne", "sans-serif"],
        "display-lg": ["Syne", "sans-serif"],
        "headline-md": ["Syne", "sans-serif"],
        "headline-sm": ["Syne", "sans-serif"],
        "body-lg":    ["DM Sans", "sans-serif"],
        "body-md":    ["DM Sans", "sans-serif"],
        "label-md":   ["DM Sans", "sans-serif"],
        "caption":    ["DM Sans", "sans-serif"],
        "data-md":    ["JetBrains Mono", "monospace"],
        "data-lg":    ["JetBrains Mono", "monospace"],
      },

      /* ── Font Size Scale ──────────────────────────────────── */
      fontSize: {
        "display-xl":  ["40px", { lineHeight: "48px", fontWeight: "800", letterSpacing: "-0.5px" }],
        "display-lg":  ["30px", { lineHeight: "38px", fontWeight: "700", letterSpacing: "-0.3px" }],
        "headline-md": ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "body-lg":     ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-md":     ["15px", { lineHeight: "22px", fontWeight: "400" }],
        "label-md":    ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "caption":     ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "data-lg":     ["18px", { lineHeight: "24px", fontWeight: "500" }],
        "data-md":     ["13px", { lineHeight: "18px", fontWeight: "400" }],
      },

      /* ── Box Shadows ──────────────────────────────────────── */
      boxShadow: {
        "card":       "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        "btn-red":    "var(--shadow-btn-red)",
        "btn-blue":   "var(--shadow-btn-blue)",
        "btn-gold":   "var(--shadow-btn-gold)",
        "sidebar":    "var(--shadow-sidebar)",
        "primary-glow": "0 0 20px color-mix(in srgb, var(--primary) 30%, transparent)",
        "blue-glow":    "0 0 20px color-mix(in srgb, var(--secondary) 30%, transparent)",
        "gold-glow":    "0 0 20px rgba(234,179,8,0.35)",
      },

      /* ── Backdrop Blur ────────────────────────────────────── */
      backdropBlur: {
        xs:    "4px",
        sm:    "8px",
        md:    "12px",
        lg:    "16px",
        xl:    "24px",
        "2xl": "40px",
      },

      /* ── Animations ───────────────────────────────────────── */
      animation: {
        "float":          "floating 6s ease-in-out infinite",
        "sparkle":        "sparkle-blue 2s ease-in-out infinite",
        "ai-pulse":       "ai-pulse-ring 2.5s ease-in-out infinite",
        "shimmer-sweep":  "shimmer-sweep 3s linear infinite",
        "progress-fill":  "progress-fill 1.5s cubic-bezier(0.4,0,0.2,1) 0.5s forwards",
        "fade-in-up":     "fade-in-up 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "pulse-dot":      "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
