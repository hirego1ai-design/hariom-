import MarketingFooter from "./MarketingFooter";
import MarketingNav from "./MarketingNav";

export default function MarketingShell({ children, home = false }: { children: React.ReactNode; home?: boolean }) {
  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <MarketingNav home={home} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
