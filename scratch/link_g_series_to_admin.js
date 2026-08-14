const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\RaAz\\OneDrive\\Desktop\\h#\\Hirego3.0\\src\\app\\admin\\settings';

const gModules = [
  { id: 'G01', slug: 'hub', name: 'Platform Settings Hub', source: '@/app/settings/hub/page' },
  { id: 'G02', slug: 'security', name: 'Security & Compliance', source: '@/app/settings/security/page' },
  { id: 'G03', slug: 'domain', name: 'Domain & SSL Settings', source: '@/app/settings/domain/page' },
  { id: 'G04', slug: 'smtp', name: 'SMTP Email Configuration', source: '@/app/settings/smtp/page' },
  { id: 'G05', slug: 'whatsapp', name: 'WhatsApp API Setup', source: '@/app/settings/whatsapp/page' },
  { id: 'G06', slug: 'payment-gateway', name: 'Payment Gateways', source: '@/app/settings/payment-gateway/page' },
  { id: 'G07', slug: 'integrations', name: 'API & Integrations Hub', source: '@/app/settings/integrations/page' },
  { id: 'G08', slug: 'llm-usage', name: 'LLM Cost & Usage Monitor', source: '@/app/settings/llm-usage/page' },
  { id: 'G09', slug: 'audit-log', name: 'System Audit Log', source: '@/app/settings/audit-log/page' },
  { id: 'G10', slug: 'ai-agents', name: 'AI Agent Manager', source: '@/app/settings/ai-agents/page' },
  { id: 'G11', slug: 'plan-management', name: 'Plan Tier Management', source: '@/app/settings/plan-management/page' },
  { id: 'G12', slug: 'analytics', name: 'Platform Analytics Hub', source: '@/app/settings/analytics/page' },
  { id: 'G13', slug: 'terms-privacy', name: 'Terms & Privacy Policy', source: '@/app/settings/terms-privacy/page' },
];

gModules.forEach((m) => {
  const dir = path.join(baseDir, m.slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const fileContent = `import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import ${m.id}Component from "${m.source}";

export default function AdminSetting_${m.id}_Page() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />
      <div className="flex-1 ml-64 flex flex-col min-w-0">
        <AdminHeader title="${m.name} (${m.id})" />
        <main className="flex-1 p-gutter overflow-y-auto">
          <${m.id}Component />
        </main>
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(path.join(dir, 'page.tsx'), fileContent);
  console.log(`Created /admin/settings/${m.slug}/page.tsx`);
});
