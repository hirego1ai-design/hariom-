import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const metadata: Metadata = {
  title: "HireGo AI — Autonomous Agentic Hiring Operating System",
  description:
    "HireGo AI is not a job portal. It is an Autonomous Agentic AI Hiring Operating System that automates the full recruitment lifecycle.",
};

/**
 * Inline script injected BEFORE first paint to prevent FOUC.
 * Reads the saved theme from localStorage and applies the correct
 * class to <html> so the page renders in the right theme immediately.
 */
const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('hirego_theme');
    var theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
    var root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="dark h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Theme initialiser — must be first script to prevent FOUC */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:ital,wght@0,300..800;1,300..800&family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
      </head>
      <body className="font-body-md min-h-full flex flex-col overflow-x-hidden">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
