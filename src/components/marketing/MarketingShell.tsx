import MarketingFooter from "./MarketingFooter";
import MarketingNav from "./MarketingNav";

export default function MarketingShell({ children, home = false }: { children: React.ReactNode; home?: boolean }) {
  return (
    <div className="relative min-h-screen bg-[#01050b] text-white">
      <MarketingNav />
      <main className={home ? undefined : "pt-24"}>{children}</main>
      <MarketingFooter />
    </div>
  );
}

