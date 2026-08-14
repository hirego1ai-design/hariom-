"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE27() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  Header  */}
<header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md mb-6">
<div>
<h1 className="font-display-xl text-display-xl-mobile md:text-display-xl text-primary leading-tight">Source Intelligence</h1>
<p className="font-body-lg text-text-secondary mt-2">Evaluate candidate quality and recruitment ROI across all channels.</p>
</div>
<div className="flex items-center gap-4">
<div className="bg-surface-container flex p-1 rounded-full border border-white/5">
<button className="px-4 py-1.5 rounded-full bg-white/5 text-primary font-medium text-label-md">Last 30 Days</button>
<button className="px-4 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-medium text-label-md">Quarterly</button>
<button className="px-4 py-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-medium text-label-md">Yearly</button>
</div>
<button className="material-symbols-outlined glass-card p-3 rounded-full text-primary hover:bg-white/5">download</button>
</div>
</header>
{/*  Bento Grid Layout  */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-6">
{/*  Source Donut Chart Card  */}
<div className="md:col-span-8 glass-card p-stack-lg rounded-xl relative overflow-hidden">

<div className="relative z-10 flex flex-col md:flex-row items-center gap-stack-lg h-full">
<div className="flex-1 w-full flex flex-col">
<h3 className="font-headline-md text-headline-md text-on-surface mb-6">Application Distribution</h3>
<div className="space-y-4">
<div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-4">
<span className="w-3 h-3 rounded-full bg-primary-container shadow-[0_0_8px_#c5221f]"></span>
<span className="font-body-md text-on-surface">Direct</span>
</div>
<span className="font-data-md text-on-surface-variant">38%</span>
</div>
<div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-4">
<span className="w-3 h-3 rounded-full bg-secondary-container shadow-[0_0_8px_#0162cf]"></span>
<span className="font-body-md text-on-surface">LinkedIn</span>
</div>
<span className="font-data-md text-on-surface-variant">29%</span>
</div>
<div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-4">
<span className="w-3 h-3 rounded-full bg-gold-payment shadow-[0_0_8px_#FBBC04]"></span>
<span className="font-body-md text-on-surface">Referral</span>
</div>
<span className="font-data-md text-on-surface-variant">18%</span>
</div>
<div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-4">
<span className="w-3 h-3 rounded-full bg-surface-variant"></span>
<span className="font-body-md text-on-surface">Opportunitiess</span>
</div>
<span className="font-data-md text-on-surface-variant">10%</span>
</div>
<div className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-colors">
<div className="flex items-center gap-4">
<span className="w-3 h-3 rounded-full bg-outline"></span>
<span className="font-body-md text-on-surface">Other</span>
</div>
<span className="font-data-md text-on-surface-variant">5%</span>
</div>
</div>
</div>
{/*  SVG Donut Chart  */}
<div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
<svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
{/*  Direct 38% (0-38)  */}
<circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#c5221f" strokeDasharray="251.2" strokeDashoffset="155.7" strokeWidth="12"></circle>
{/*  LinkedIn 29% (38-67)  */}
<circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#0162cf" strokeDasharray="251.2" strokeDashoffset="223.6" strokeWidth="12" ></circle>
{/*  Referral 18% (67-85)  */}
<circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#FBBC04" strokeDasharray="251.2" strokeDashoffset="206.0" strokeWidth="12" ></circle>
{/*  Opportunitiess 10% (85-95)  */}
<circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#43302e" strokeDasharray="251.2" strokeDashoffset="226.1" strokeWidth="12" ></circle>
{/*  Other 5% (95-100)  */}
<circle className="donut-segment" cx="50" cy="50" fill="transparent" r="40" stroke="#ab8984" strokeDasharray="251.2" strokeDashoffset="238.6" strokeWidth="12" ></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="font-display-xl text-[42px] text-on-surface">1,284</span>
<span className="font-label-md text-on-surface-variant uppercase tracking-widest">Total Apps</span>
</div>
</div>
</div>
</div>
{/*  Recommendations Card  */}
<div className="md:col-span-4 glass-card p-stack-lg rounded-xl border-l-[6px] border-l-red-light flex flex-col">
<div className="flex items-center gap-3 mb-stack-md">
<span className="material-symbols-outlined text-red-light" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
<h3 className="font-headline-md text-headline-md text-on-surface">AI Strategy</h3>
</div>
<div className="space-y-6 flex-1">
<p className="font-body-md text-on-surface-variant leading-relaxed">
                        Based on <span className="text-primary font-bold">18% lower cost-per-hire</span> and <span className="text-gold-payment font-bold">84% retention potential</span>, we recommend shifting budget from Opportunitiess to LinkedIn Sponsored content.
                    </p>
<div className="p-4 bg-white/5 rounded-lg border border-white/5">
<span className="font-label-md text-primary uppercase block mb-1">Impact Projection</span>
<div className="flex items-baseline gap-2">
<span className="text-[32px] font-display-xl text-on-surface">+22%</span>
<span className="font-body-md text-green">Efficiency</span>
</div>
</div>
</div>
<button className="btn-primary-blue mt-stack-lg w-full flex items-center justify-center gap-2 font-bold">
<span className="material-symbols-outlined">trending_up</span>
                    Optimize Spend
                </button>
</div>
{/*  ROI Chart Card  */}
<div className="md:col-span-12 lg:col-span-5 glass-card p-stack-lg rounded-xl flex flex-col h-full">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline-md text-headline-md text-on-surface">Channel ROI</h3>
<span className="font-label-md text-on-surface-variant">Efficiency vs Spend</span>
</div>
<div className="flex-1 flex flex-col gap-6 justify-between">
{/*  ROI Bar Chart (CSS based)  */}
<div className="space-y-8 py-4">
<div className="space-y-2">
<div className="flex justify-between text-label-md text-on-surface-variant">
<span>Referral</span>
<span>8.4x</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-gold-payment rounded-full shadow-[0_0_12px_#FBBC04]" style={{ width: '84%' }}></div>
</div>
</div>
<div className="space-y-2">
<div className="flex justify-between text-label-md text-on-surface-variant">
<span>Direct</span>
<span>6.1x</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-primary-container rounded-full" style={{ width: '61%' }}></div>
</div>
</div>
<div className="space-y-2">
<div className="flex justify-between text-label-md text-on-surface-variant">
<span>LinkedIn</span>
<span>4.9x</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-secondary-container rounded-full" style={{ width: '49%' }}></div>
</div>
</div>
<div className="space-y-2">
<div className="flex justify-between text-label-md text-on-surface-variant">
<span>Opportunitiess</span>
<span>2.3x</span>
</div>
<div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
<div className="h-full bg-surface-variant rounded-full" style={{ width: '23%' }}></div>
</div>
</div>
</div>
</div>
</div>
{/*  Quality Metrics Table Card  */}
<div className="md:col-span-12 lg:col-span-7 glass-card p-stack-lg rounded-xl overflow-hidden">
<div className="flex items-center justify-between mb-6">
<h3 className="font-headline-md text-headline-md text-on-surface">Quality Per Source</h3>
<button className="text-primary font-medium text-label-md flex items-center gap-1 hover:underline">
                        Detailed Stats <span className="material-symbols-outlined text-[16px]">open_in_new</span>
</button>
</div>
<div className="overflow-x-auto custom-scrollbar">
<table className="w-full text-left">
<thead>
<tr className="border-b border-white/10">
<th className="py-4 font-label-md text-on-surface-variant uppercase tracking-wider">Source</th>
<th className="py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-right">Avg Hire Score</th>
<th className="py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-right">Interview Conv.</th>
<th className="py-4 font-label-md text-on-surface-variant uppercase tracking-wider text-right">Offer Acc.</th>
</tr>
</thead>
<tbody className="divide-y divide-white/5">
<tr className="hover:bg-white/5 transition-colors group">
<td className="py-5">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-gold-payment/10 flex items-center justify-center">
<span className="material-symbols-outlined text-gold-payment text-[18px]">group</span>
</div>
<span className="font-body-md font-medium">Referral</span>
</div>
</td>
<td className="py-5 text-right font-data-md text-on-surface">88/100</td>
<td className="py-5 text-right font-data-md text-on-surface">42.5%</td>
<td className="py-5 text-right font-data-md text-green">94.1%</td>
</tr>
<tr className="hover:bg-white/5 transition-colors group">
<td className="py-5">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-primary-container/10 flex items-center justify-center">
<span className="material-symbols-outlined text-primary-container text-[18px]">language</span>
</div>
<span className="font-body-md font-medium">Direct</span>
</div>
</td>
<td className="py-5 text-right font-data-md text-on-surface">76/100</td>
<td className="py-5 text-right font-data-md text-on-surface">28.2%</td>
<td className="py-5 text-right font-data-md text-on-surface">78.5%</td>
</tr>
<tr className="hover:bg-white/5 transition-colors group">
<td className="py-5">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-secondary-container/10 flex items-center justify-center">
<span className="material-symbols-outlined text-secondary-container text-[18px]">work</span>
</div>
<span className="font-body-md font-medium">LinkedIn</span>
</div>
</td>
<td className="py-5 text-right font-data-md text-on-surface">81/100</td>
<td className="py-5 text-right font-data-md text-on-surface">31.7%</td>
<td className="py-5 text-right font-data-md text-on-surface">82.0%</td>
</tr>
<tr className="hover:bg-white/5 transition-colors group">
<td className="py-5">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded-lg bg-surface-variant/20 flex items-center justify-center">
<span className="material-symbols-outlined text-on-surface-variant text-[18px]">grid_view</span>
</div>
<span className="font-body-md font-medium">Opportunitiess</span>
</div>
</td>
<td className="py-5 text-right font-data-md text-on-surface">64/100</td>
<td className="py-5 text-right font-data-md text-on-surface">12.8%</td>
<td className="py-5 text-right font-data-md text-error">61.4%</td>
</tr>
</tbody>
</table>
</div>
</div>
{/*  Referral Network Insight  */}
<div className="md:col-span-12 glass-card p-stack-lg rounded-xl overflow-hidden relative">
<div className="flex flex-col md:flex-row gap-stack-lg items-center">
<div className="flex-1 space-y-4">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-gold-payment" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
<h3 className="font-headline-md text-headline-md text-on-surface">Top Referrers This Quarter</h3>
</div>
<p className="font-body-md text-on-surface-variant max-w-xl">Employee referrals remain your highest quality source. These individuals are leading your internal advocacy program.</p>
<div className="flex flex-wrap gap-4 mt-6">
<div className="flex items-center gap-3 p-3 rounded-full bg-white/5 border border-white/5">
<img className="w-8 h-8 rounded-full" data-alt="A round profile icon for a senior software engineer with glasses and a friendly smile. Professional headshot aesthetic with soft rim lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDb5x7x0sJ3PsVq3obnTfqsw7Cfn3y4rO9iSHRcyd9rGeRg9SdbLGWutEHdCKNQnD6IB7ahrjY5sZ3YnnivuZBFzKGq1OasYhgzfPckpO2pT1uyrwqLmbM8henSQsLDkUyZ0agTt9Lc0cHnd5snrwVZY4ifwfwdWKc0j_nhaNGQPoOjv3nvUlMwA_16ySD8o7at6et47kKlJzOeSv1xFU6efCuocYmN_3KVnZledfzTImjsc9oXhtJlYUJGm8js2_4C96kS5vqDMzw" />
<span className="font-label-md font-medium pr-2">Alex Chen (4)</span>
</div>
<div className="flex items-center gap-3 p-3 rounded-full bg-white/5 border border-white/5">
<img className="w-8 h-8 rounded-full" data-alt="A circular profile photo of a marketing manager, professional and vibrant, high-end corporate photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxJkRmr5YimH5bkvy8DQnUjt1YeIc48D09plFfAgsFeLjaFLbdhxy07geBv1qdrcTF0c3lArSPXtcuAeMDLELuHNXRtNoou2PGkX8EMfZ9DgBxkItBAhaDmXWnXWWlrTwdZsypYz4Y1uo9dwp4YUak7rDXAxiqIdZ3ggSOvGIUyYY0KrusJJqPwJhkRB25FRtJZHXp_fB8lwngHh4D7Pk4HcWhV5S5nDYKranIYs9kYKpLaeXmMGAr8Df7ENvvOl8C72W7ohVMZ9w" />
<span className="font-label-md font-medium pr-2">Sarah Miller (3)</span>
</div>
<div className="flex items-center gap-3 p-3 rounded-full bg-white/5 border border-white/5">
<img className="w-8 h-8 rounded-full" data-alt="A round avatar of a product designer, looking creative and professional, warm studio lighting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuChp2wNj6T00oH9R990SzcyjTggGJSZeL5CEDbxfkz9Y-60XAjaBl7zfOfY7_8UgTwaL57WsgnQ6fOe16z-u5exCHY2Yo7YaNCtdYmHjM_24-UU3M4NQ8wCJ1rilHwOREGHYoFLvCBKQFYmdbPXMep8dWOUeECesnzYc0kBwsvX1N9qDvN6NByzIdH91edLbStKU23nUwiUMteP0atPGhaFEhBK5CacEkZfpnxwy5SPCtCnypc9VwCk3R4OtE0OZs72K3R5W6RGmRs" />
<span className="font-label-md font-medium pr-2">David K. (2)</span>
</div>
</div>
</div>
<div className="w-full md:w-1/3 glass-card bg-2 rounded-xl p-6 border-gold-payment/30">
<h4 className="font-label-md text-gold-payment uppercase mb-4 tracking-wider">Referral Velocity</h4>
<div className="flex items-end gap-1 h-20 mb-4">
<div className="w-full bg-gold-payment/20 rounded-t h-[40%]"></div>
<div className="w-full bg-gold-payment/30 rounded-t h-[60%]"></div>
<div className="w-full bg-gold-payment/40 rounded-t h-[55%]"></div>
<div className="w-full bg-gold-payment/50 rounded-t h-[75%]"></div>
<div className="w-full bg-gold-payment/70 rounded-t h-[90%] shadow-[0_-4px_10px_#FBBC04]"></div>
</div>
<div className="flex justify-between font-data-md text-[10px] text-on-surface-variant">
<span>WK 12</span>
<span>WK 13</span>
<span>WK 14</span>
<span>WK 15</span>
<span>WK 16</span>
</div>
</div>
</div>
</div>
</div>

    </PageContainer>
  );
}
