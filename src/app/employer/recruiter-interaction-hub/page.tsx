"use client";
import React from "react";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

export default function EmployerPageE70() {
  return (
    <PageContainer>
      {/*
        This is an auto-generated component. 
        In Phase 4, we will manually hook up the EmployerContext to interactive elements.
      */}

{/*  TopNavBar  */}
<header className="h-[64px] w-full sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between ">
<div className="flex items-center gap-6">
<div className="relative group">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
<input className="h-10 w-[300px] pl-10 pr-4 bg-bg-elevated border-none rounded-full text-sm text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-primary/50" placeholder="Search recruiters or messages..." type="text" />
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-text-secondary hover:bg-white/5 rounded-full transition-colors relative">
<span className="material-symbols-outlined">notifications</span>
<span className="absolute top-2 right-2 w-2 h-2 bg-red-light rounded-full border border-background"></span>
</button>
<button className="p-2 text-text-secondary hover:bg-white/5 rounded-full transition-colors">
<span className="material-symbols-outlined">auto_awesome</span>
</button>
<div className="h-8 w-[1px] bg-white/10 mx-2"></div>
<div className="flex items-center gap-3">
<span className="font-label-md text-text-primary hidden sm:block">Alex Rivera</span>
<div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
<img className="w-full h-full object-cover" data-alt="A professional studio headshot of a young Hispanic male professional in a dark grey tailored suit, clean lighting, blurred modern office background with subtle warm tones, high-end photography style consistent with a premium tech brand." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdCrYSOn0kHir2LgvxesmmQjMZbzqe5GXGIprOIJGiTOcTPek9LQ4SgY75PR2aYGKbh0flTZGZfLDZ5EpdSxDSYAPH3LnZO3ac2RPelZH8yRd2zisiI6IKjlugUhgCBT2yaLLZDmf_ossNwHy2qnFbut240UIg1thyWARwE3NtoRGqkMbzylYSfOsdu_ao5a4yUxGbhL8BYaQ4Ro2X21I7lgK6PadTP0YCGjzW5bvKyeU93w3ScySmjJfjvJYpWOqfnEN3GK5LjzU" />
</div>
</div>
</div>
</header>
{/*  Page Content  */}
<div className="p-margin-desktop space-y-6 max-w-7xl mx-auto w-full">
{/*  Header Section  */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h2 className="font-display-lg text-text-primary">Recruiter Interaction Hub</h2>
<p className="text-text-secondary font-body-md mt-1">Manage your active conversations and inbound connection requests.</p>
</div>
<div className="flex gap-3">
<div className="flex items-center gap-2 px-4 py-2 glass-card rounded-full">
<div className="w-2 h-2 rounded-full bg-green ai-pulse"></div>
<span className="text-[12px] font-label-md text-green">AI Recruiter Assistant Active</span>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
{/*  Column Left: Active Connections  */}
<div className="lg:col-span-8 space-y-stack-md">
<div className="flex items-center justify-between">
<h3 className="font-headline-md text-body-lg text-text-primary">Active Connections</h3>
<button className="text-primary font-label-md hover:underline">View all</button>
</div>
{/*  Bento-ish Grid for Connections  */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
{/*  Card 1  */}
<div className="glass-card p-6 rounded-lg group hover:scale-[1.01] transition-transform cursor-pointer">
<div className="flex items-start justify-between mb-4">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5">
<img className="w-full h-full object-cover rounded-full" data-alt="A professional portrait of a female recruiter, mid-40s, confident smile, wearing a cream blazer, soft studio lighting, high resolution, corporate aesthetic with a modern dark mode background context." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpO4OelBGFioxLsI-pDJeSvK7hi8tfshi5KZnTpBypLQzS1GgyvYnSxXd_hv-Dj0MK3LtIKtaoYWJ2W3AOxexFhXVfS4TWVRHKlcNRyCQ2WULNykkqLk-aoeV8C1S8Q5QvGuj878blJ-h_QYUlo76_C4tZeUfUtExAR5GgNQ7nFxrOVbsDxOZJgRQGU7kG3cQQPMnOXAFjoHvQhSNzKUDiQo5AkQXQzoOL-vl4k_H6mqBdKt9ixSI44V63YLWdXZBUH90WK0bfvCg" />
</div>
<div>
<h4 className="font-headline-md text-[18px] text-text-primary">Sarah Jenkins</h4>
<p className="text-[14px] text-text-secondary">Senior Recruiter, Google</p>
</div>
</div>
<span className="text-[12px] font-data-md text-text-muted">2h ago</span>
</div>
<p className="text-text-secondary text-[14px] line-clamp-2 mb-6 leading-relaxed">
                                    "We were really impressed with your portfolio. Would you be available for a quick screening call tomorrow afternoon?"
                                </p>
<button className="w-full h-[50px] rounded-full btn-blue flex items-center justify-center gap-2 text-white font-bold">
<span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                                    Message
                                </button>
</div>
{/*  Card 2  */}
<div className="glass-card p-6 rounded-lg group hover:scale-[1.01] transition-transform cursor-pointer">
<div className="flex items-start justify-between mb-4">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5">
<img className="w-full h-full object-cover rounded-full" data-alt="A focused portrait of a male tech recruiter in his late 20s, wearing a black turtleneck, sharp features, neutral expression, soft rim lighting, modern workspace backdrop, professional photography." src="https://lh3.googleusercontent.com/aida-public/AB6AXuChjmDUNslwtTNV7f-BRCl1MJkf2-OknZ7hVp7S9ddIldz1Elq04HduAdUZrBc3UfgK7wrlTL9iF6k-SbcFAjC4WqgjklwrJ_EctDCClAhbFneTfn83QdKcThiGFUhEBG6LdZquWuvlH2fGMxqPp2wjlTfKnJyvvvMFFhsCPtnnGKNX7-xIdB5iKZi7DCLOnLIR-3cZ_37dT_7OyejvUdwyzzT0X6QvEnNP3_JILXMhJIKCr6HVweEgPBw4JEUrcDcr-uEy_C_IBeI" />
</div>
<div>
<h4 className="font-headline-md text-[18px] text-text-primary">Marcus Thorne</h4>
<p className="text-[14px] text-text-secondary">Head of Talent, Stripe</p>
</div>
</div>
<span className="text-[12px] font-data-md text-text-muted">6h ago</span>
</div>
<p className="text-text-secondary text-[14px] line-clamp-2 mb-6 leading-relaxed">
                                    "The team reviewed your technical assessment and the feedback was exceptional. Let's discuss next steps."
                                </p>
<button className="w-full h-[50px] rounded-full btn-blue flex items-center justify-center gap-2 text-white font-bold">
<span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                                    Message
                                </button>
</div>
{/*  Card 3  */}
<div className="glass-card p-6 rounded-lg group hover:scale-[1.01] transition-transform cursor-pointer">
<div className="flex items-start justify-between mb-4">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5">
<img className="w-full h-full object-cover rounded-full" data-alt="Corporate headshot of an Asian female talent acquisition lead, elegant attire, bright and airy lighting contrast against the dark UI theme, professional, friendly, high-quality resolution." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBc1dieGeg1V7hXFGxOeZVEc4DroRKLB89Rp-vruIzw7H9dzjZDKC9a0l6BRbGX6V46E4PD2dH8TUrBUsSpWuAhAe1DhyWS-EdpG-iSvXHle-L5Gejb-NdylOcKnRZ8WX9GrWPC0O5vqWMHiFcax4RS7XPiRaHGwsRySXMuqpseeQI8UtJPv6WDzRhUHvCbTS_cG-P_b51WmtAwRiayjCY29K2NfH9OzosQl56-aGgC1wODTLHZKAACdaY6E2kjgz2bTSYh8tWud7s" />
</div>
<div>
<h4 className="font-headline-md text-[18px] text-text-primary">Elena Zhao</h4>
<p className="text-[14px] text-text-secondary">HR Director, Canva</p>
</div>
</div>
<span className="text-[12px] font-data-md text-text-muted">Yesterday</span>
</div>
<p className="text-text-secondary text-[14px] line-clamp-2 mb-6 leading-relaxed">
                                    "I've attached the benefits package for your review. Let me know if you have any questions before our final meet."
                                </p>
<button className="w-full h-[50px] rounded-full btn-blue flex items-center justify-center gap-2 text-white font-bold">
<span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                                    Message
                                </button>
</div>
{/*  Card 4  */}
<div className="glass-card p-6 rounded-lg group hover:scale-[1.01] transition-transform cursor-pointer">
<div className="flex items-start justify-between mb-4">
<div className="flex items-center gap-4">
<div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5">
<img className="w-full h-full object-cover rounded-full" data-alt="A portrait of a male recruiter with glasses, friendly expression, blue shirt, warm professional lighting, modern blurred tech office background, extremely high detail, sophisticated vibe." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9vLyrAfNe0TlKt3xOtoGEydFtRWNl1F7P9Vs2Ggcvd-cI7_jfpeqIocud8gKypKqIInixdyMTKsfH_bTEKB-dvy16IOvYiuVYBy-nbNLiZmaP9JMiZY812oXKTch24yY86Ylaj0NqazCCXzKDy7XN9NpUKXk8jZPaXV92WKWPvHXSvD1H61_upzZ6YbgtQhPckIC3bL50H_Zh-464FDO4-P7tAABKsVu0op3vq2rEtRbSiy5khFsWaIwihk1cUniBMkfytsR9BmI" />
</div>
<div>
<h4 className="font-headline-md text-[18px] text-text-primary">David Cohen</h4>
<p className="text-[14px] text-text-secondary">Global Talent, Meta</p>
</div>
</div>
<span className="text-[12px] font-data-md text-text-muted">2d ago</span>
</div>
<p className="text-text-secondary text-[14px] line-clamp-2 mb-6 leading-relaxed">
                                    "Just checking in to see how your other interviews are going. We're still very interested in your profile."
                                </p>
<button className="w-full h-[50px] rounded-full btn-blue flex items-center justify-center gap-2 text-white font-bold">
<span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                                    Message
                                </button>
</div>
</div>
</div>
{/*  Column Right: Inbound Requests & History  */}
<div className="lg:col-span-4 space-y-6">
{/*  Inbound Requests  */}
<section className="space-y-stack-md">
<h3 className="font-headline-md text-body-lg text-text-primary">Inbound Requests</h3>
<div className="space-y-stack-sm">
{/*  Request 1  */}
<div className="glass-card p-5 rounded-lg border-l-4 border-primary">
<div className="flex gap-4 mb-4">
<div className="w-12 h-12 rounded-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="A professional recruiter portrait, female with dark hair, minimal makeup, corporate attire, soft diffused lighting, tech aesthetic, 8k resolution." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpCDv4GNAiKf5L6XDVYFHIWIYK7-1tCNAD2XDv8XBKf0vEx6cYNmXi3ITrZB7eZF7V0CwjCOhy7njGClVT1FEEKoh-ORpnKb1SUfNfUMztohT2stNsrG7nhPx26EO_mjfFxTKzWA3Ch47IxapHr-2NpSLUqkY7xF2CJtrhELV4vCEDz8xjxZ7pc-OTPpjQijnwS7DtuDjb9BR0bnQD8J-2odJkJbjY70f1XiZgclZ5s7seDEAWlnxCa-zGTA_glfJxIBUbl3paeW0" />
</div>
<div className="flex-1">
<h5 className="font-bold text-text-primary text-[15px]">Sophie Laurent</h5>
<p className="text-[12px] text-text-secondary">Recruiter @ Airbnb</p>
</div>
</div>
<div className="flex gap-2">
<button className="flex-1 h-10 rounded-full btn-green text-[13px] font-bold text-white">Accept</button>
<button className="flex-1 h-10 rounded-full btn-ghost text-[13px] font-bold text-text-secondary">Decline</button>
</div>
</div>
{/*  Request 2  */}
<div className="glass-card p-5 rounded-lg border-l-4 border-primary">
<div className="flex gap-4 mb-4">
<div className="w-12 h-12 rounded-full overflow-hidden">
<img className="w-full h-full object-cover" data-alt="Modern professional portrait of a male recruiter in a grey blazer, professional and approachable, high-end photography, blurred glass office background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD79sKf1rbGRizcYv96nS5jiAXpm8URoFU1o8Jnw3K8HjFnExzbOSWUpOvNCo0UCvnfVUx_auWpo8xajH1X2AgmHAxo63ByO9MGOVdzHEjc05lwl_KYU2_s8zjz4D9lFx8xsQJutgk6IiaZNy3IEfyRNdma6upl5EakqELTBSVNAT5ug2HkTm1NVlcpe1yMX6D7VqZCX7h2xqEFIWffe6i82WXcxONEIpssQ6lorRD9XdobSUH4itdLYxWhtBwU1MHUpexkOhzr9A4" />
</div>
<div className="flex-1">
<h5 className="font-bold text-text-primary text-[15px]">James Wilson</h5>
<p className="text-[12px] text-text-secondary">Staffing Lead @ Tesla</p>
</div>
</div>
<div className="flex gap-2">
<button className="flex-1 h-10 rounded-full btn-green text-[13px] font-bold text-white">Accept</button>
<button className="flex-1 h-10 rounded-full btn-ghost text-[13px] font-bold text-text-secondary">Decline</button>
</div>
</div>
</div>
</section>
{/*  Connection History  */}
<section className="space-y-stack-md">
<h3 className="font-headline-md text-body-lg text-text-primary">Recent History</h3>
<div className="glass-card rounded-lg divide-y divide-white/5">
<div className="p-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-primary">person</span>
</div>
<div>
<p className="text-[13px] font-bold text-text-primary">Robert Fox</p>
<p className="text-[11px] text-text-muted">Microsoft</p>
</div>
</div>
<span className="px-2 py-1 bg-green/10 text-green rounded-full text-[10px] font-bold uppercase tracking-wider">Accepted</span>
</div>
<div className="p-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-text-muted">person</span>
</div>
<div>
<p className="text-[13px] font-bold text-text-primary">Linda Meyer</p>
<p className="text-[11px] text-text-muted">Amazon</p>
</div>
</div>
<span className="px-2 py-1 bg-white/5 text-text-muted rounded-full text-[10px] font-bold uppercase tracking-wider">Declined</span>
</div>
<div className="p-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-primary">person</span>
</div>
<div>
<p className="text-[13px] font-bold text-text-primary">Chris Pratt</p>
<p className="text-[11px] text-text-muted">Adobe</p>
</div>
</div>
<span className="px-2 py-1 bg-green/10 text-green rounded-full text-[10px] font-bold uppercase tracking-wider">Accepted</span>
</div>
<div className="p-4 flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
<span className="material-symbols-outlined text-[18px] text-yellow">person</span>
</div>
<div>
<p className="text-[13px] font-bold text-text-primary">Sarah Connor</p>
<p className="text-[11px] text-text-muted">SkyNet</p>
</div>
</div>
<span className="px-2 py-1 bg-yellow/10 text-yellow rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
</div>
</div>
</section>
</div>
</div>
</div>

    </PageContainer>
  );
}
