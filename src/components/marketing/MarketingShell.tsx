import MarketingFooter from "./MarketingFooter";
import MarketingNav from "./MarketingNav";

export default function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
