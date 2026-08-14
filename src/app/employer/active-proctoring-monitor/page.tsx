"use client";
import React from "react";
import StitchPageEngine from "@/components/StitchPageEngine";
import { PageContainer, PageHeader, Card } from "@/components/employer/LayoutSystem";

const rawHtml = `<style>
        body {
            background-color: #0E0E0E;
            background-image: 
                radial-gradient(circle at top right, rgba(91, 158, 248, 0.08), transparent 40%),
                radial-gradient(circle at bottom left, rgba(229, 57, 53, 0.08), transparent 40%),
                linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
            color: #F5F5F5;
            overflow: hidden;
            height: 100vh;
        }

        .glass-card {
            background: rgba(22, 22, 22, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .integrity-gradient {
            background: linear-gradient(135deg, #E53935 0%, #C5221F 100%);
            box-shadow: 0 4px 0 #9B1B18;
        }

        .status-pulse {
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
            100% { opacity: 1; transform: scale(1); }
        }

        .scanline {
            width: 100%;
            height: 2px;
            background: rgba(91, 158, 248, 0.2);
            position: absolute;
            top: 0;
            left: 0;
            animation: scan 4s linear infinite;
        }

        @keyframes scan {
            0% { top: 0%; }
            100% { top: 100%; }
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
    </style>\n
<!-- Main Content Grid -->
<div className="grid grid-cols-12 h-screen w-full p-6 gap-6 relative">
<!-- Center Monitoring Panel (Left 9 Columns) -->
<div className="col-span-9 flex flex-col gap-6 relative">
<!-- Header Identity -->
<div className="flex items-center justify-between">
<div className="flex items-center gap-3">
<div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary-container text-on-primary-container">
<span className="material-symbols-outlined">security</span>
</div>
<div>
<h1 className="font-headline-md text-headline-md tracking-tight uppercase">HireGo AI <span className="text-primary/50 text-sm font-normal">C85.Proctor</span></h1>
<p className="text-text-secondary font-label-md text-label-md">ACTIVE SESSION: UX_DESIGN_SENIOR_R4</p>
</div>
</div>
<div className="flex items-center gap-4">
<div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
<span className="w-2 h-2 rounded-full bg-green status-pulse"></span>
<span className="text-xs font-label-md uppercase tracking-wider">System Online</span>
</div>
<div className="glass-card px-4 py-2 rounded-full flex items-center gap-2">
<span className="material-symbols-outlined text-sm">schedule</span>
<span className="font-data-md text-data-md" id="timer">45:12 REMAINING</span>
</div>
</div>
</div>
<!-- Main Canvas (Application/Assessment view) -->
<div className="flex-grow glass-card rounded-lg relative overflow-hidden group">
<!-- Background Assessment Image -->
<div className="absolute inset-0 z-0 opacity-40">
<div className="w-full h-full bg-cover bg-center" data-alt="A high-fidelity digital user interface design dashboard displaying complex analytical charts, dark mode aesthetic, with deep red and vibrant blue highlights. The layout is professional and sleek, featuring semi-transparent glassmorphism elements and sharp typography, suggesting a high-stakes technical assessment environment in a dark, atmospheric studio setting." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDbLfd7tN25F1XaeocD1cxLTfXEpuuyXhF6fwjEQX7D08G9n_B-XX5PPjj1FxJ17-j2I5RDkKRJMLf6WAbX_50sj5twyTHO4GrJsnqpkNCd-LcY1EtYXm5VkTTkaHfjgYknQLwT2tL4i_EakOk4mMfgu2Hnx5Yd6nxbj0lXlxceyb0tRE3fBF1YkCYGysOM7MJOqZJNP_bZcZ3srtjqeP3Ytmfeyh67zUjEqobDy-igU7-hJe7hwuXLPOrqphyqWQaf4R4M7JFI0Xo')"></div>
</div>
<!-- HUD Overlays -->
<div className="absolute inset-0 border-[20px] border-white/5 pointer-events-none z-10"></div>
<div className="scanline z-10"></div>
<!-- Center Focus Crosshair -->
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
<div className="w-32 h-32 border border-white/40 rounded-full flex items-center justify-center">
<div className="w-4 h-4 border border-white/60 rounded-full"></div>
</div>
</div>
<!-- PiP Camera Feed (Corner 200x150px) -->
<div className="absolute bottom-6 right-6 w-[200px] h-[150px] rounded-lg overflow-hidden glass-card z-30 shadow-2xl border-2 border-primary/20">
<div className="absolute top-2 left-2 z-40 bg-black/50 px-1.5 py-0.5 rounded text-[10px] font-data-md text-primary">LIVE_FEED</div>
<div className="w-full h-full bg-cover bg-center grayscale contrast-125" data-alt="A focused young professional candidate sitting in a dimly lit, minimalist workspace during a remote video interview. The lighting is soft and directional, casting subtle shadows while maintaining a clean professional aesthetic. The subject is centered, looking directly into the webcam, wearing a smart-casual dark shirt, against a neutral, slightly blurred office background." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC8a2jpuvBM_ivNtyhQH0MATiEe00hhn0cjpl682jTPXhbCv-Vht81j_VFklVni41YkcRd-FcT9gF1FDcz02EDtSBZyn33x7uyuFeaoYqL9NcKdl2hJXB2vNReXI_yZd55pOo4rhUgg_ICa9hgVI8g15QC0g0yY2dD82-v6NzBwkDoZn-MYuH0n4vRcWbNNzz32pIatF6P6ReV3OqVOQAwH1jGWSCkAWNBPg4yzgNhmWgwCzsHwXYQvyAFRsCYJ9h_Tp_JMZ5i0aoE')"></div>
<div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
<!-- Tracking Box -->
<div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border border-green/50 rounded-sm"></div>
</div>
<!-- Indicator Badges -->
<div className="absolute top-6 left-6 flex flex-col gap-3 z-30">
<div className="glass-card px-4 py-3 rounded-lg flex items-center gap-4 min-w-[200px]">
<span className="material-symbols-outlined text-green" style="font-variation-settings: 'FILL' 1;">face</span>
<div className="flex flex-col">
<span className="text-[10px] text-text-secondary uppercase leading-none mb-1">Face Recognition</span>
<span className="text-green font-bold text-xs uppercase tracking-widest">Active & Visible</span>
</div>
</div>
<div className="glass-card px-4 py-3 rounded-lg flex items-center gap-4 min-w-[200px]">
<span className="material-symbols-outlined text-green" style="font-variation-settings: 'FILL' 1;">person</span>
<div className="flex flex-col">
<span className="text-[10px] text-text-secondary uppercase leading-none mb-1">Room Occupancy</span>
<span className="text-green font-bold text-xs uppercase tracking-widest">Single Person</span>
</div>
</div>
<div className="glass-card px-4 py-3 rounded-lg flex items-center gap-4 min-w-[200px]">
<span className="material-symbols-outlined text-green" style="font-variation-settings: 'FILL' 1;">tab_unselected</span>
<div className="flex flex-col">
<span className="text-[10px] text-text-secondary uppercase leading-none mb-1">Window Focus</span>
<span className="text-green font-bold text-xs uppercase tracking-widest">No Tab Switch</span>
</div>
</div>
</div>
</div>
<!-- Bottom Controls -->
<div className="h-16 flex items-center justify-between">
<div className="flex gap-4">
<button className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-white transition-all active:scale-95">
<span className="material-symbols-outlined">mic</span>
</button>
<button className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-white transition-all active:scale-95">
<span className="material-symbols-outlined">videocam</span>
</button>
<button className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-text-secondary hover:text-white transition-all active:scale-95">
<span className="material-symbols-outlined">screen_share</span>
</button>
</div>
<div className="flex gap-4">
<button className="px-8 h-[50px] rounded-full border border-white/10 bg-white/5 font-label-md text-label-md hover:bg-white/10 transition-all active:scale-95">
                        PAUSE MONITORING
                    </button>
<button className="px-8 h-[50px] rounded-full integrity-gradient font-bold text-label-md hover:brightness-110 transition-all active:scale-95 text-white">
                        TERMINATE SESSION
                    </button>
</div>
</div>
</div>
<!-- Sidebar (Right 3 Columns) -->
<div className="col-span-3 flex flex-col gap-6">
<!-- Integrity Score Card -->
<div className="glass-card rounded-lg p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
<div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
<h3 className="text-text-secondary font-label-md text-label-md uppercase tracking-widest mb-4">Integrity Score</h3>
<div className="relative">
<span className="font-data-lg text-[64px] leading-none text-primary font-bold" id="integrity-score">98</span>
<span className="font-data-md text-xl text-primary/50">%</span>
</div>
<p className="mt-4 text-green text-xs font-bold uppercase tracking-tighter">Status: High Confidence</p>
<div className="w-full mt-6 flex flex-col gap-2">
<div className="flex justify-between text-[10px] uppercase font-label-md text-text-secondary">
<span>Reliability</span>
<span>Excellent</span>
</div>
<div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
<div className="w-[98%] h-full bg-green"></div>
</div>
</div>
</div>
<!-- Violation Log -->
<div className="flex-grow glass-card rounded-lg flex flex-col overflow-hidden">
<div className="p-4 border-b border-white/5 flex items-center justify-between">
<h3 className="font-label-md text-label-md uppercase tracking-widest text-text-primary">Event Log</h3>
<span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-text-secondary">REAL-TIME</span>
</div>
<div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
<!-- Log Item (Success) -->
<div className="p-3 rounded bg-white/5 border-l-2 border-green/50 flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="text-[10px] font-data-md text-green">14:22:10</span>
<span className="material-symbols-outlined text-[14px] text-green">check_circle</span>
</div>
<p className="text-xs text-text-secondary">Identity verified successfully via biometric handshake.</p>
</div>
<!-- Log Item (Info) -->
<div className="p-3 rounded bg-white/5 border-l-2 border-secondary/50 flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="text-[10px] font-data-md text-secondary">14:15:45</span>
<span className="material-symbols-outlined text-[14px] text-secondary">info</span>
</div>
<p className="text-xs text-text-secondary">Environment noise check: Normalized (32dB).</p>
</div>
<!-- Log Item (Warning) -->
<div className="p-3 rounded bg-white/5 border-l-2 border-yellow/50 flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="text-[10px] font-data-md text-yellow">14:08:22</span>
<span className="material-symbols-outlined text-[14px] text-yellow">warning</span>
</div>
<p className="text-xs text-text-secondary">Minor eye-gaze deviation detected. Continued tracking.</p>
</div>
<!-- Log Item (Warning) -->
<div className="p-3 rounded bg-white/5 border-l-2 border-yellow/50 flex flex-col gap-1">
<div className="flex justify-between items-center">
<span className="text-[10px] font-data-md text-yellow">13:59:01</span>
<span className="material-symbols-outlined text-[14px] text-yellow">warning</span>
</div>
<p className="text-xs text-text-secondary">Multi-monitor check failure: Port 3 active but idle.</p>
</div>
<!-- Empty state/Loading animation -->
<div className="mt-auto py-4 flex flex-col items-center opacity-30">
<div className="w-1 h-8 bg-primary rounded-full animate-bounce"></div>
<span className="text-[10px] font-data-md mt-2">MONITORING ENGINE RUNNING</span>
</div>
</div>
</div>
<!-- Candidate Quick Info -->
<div className="glass-card rounded-lg p-4 flex items-center gap-4">
<div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
<img className="w-full h-full object-cover" data-alt="A professional circular avatar portrait of a candidate, a young male with short dark hair, wearing a navy polo shirt, clear skin, smiling subtly, high-quality studio lighting on a plain dark grey background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaLFMwl1DMK_KDM-5qbIpg4UPyVRpe87PWoQghU_GX7wR9QF7F-mOSHVxxot6qOZAzWLahQKEaa1HW0Jtkf2Xr7h-y4G9I99ggTHlKHe5KOBehBTaCnd4esj8wj_TO4t8WJKJiZDGW2vIkbZCVcgcLkfcMZOxZAOU72_jAm6gEamC3T9fNFEZ4wcQ7hfLx4LmPw9MyMQN2NIHIkAFKvCGJzXkyYzUoHCsaFi25fcZlxRRlrkCF0GV2Qm9h99dFTodNTyK1QKIv0vk"/>
</div>
<div className="flex flex-col">
<span className="text-xs font-bold text-text-primary">Alex Chen</span>
<span className="text-[10px] text-text-secondary">ID: #C85-4492-AX</span>
<span className="text-[10px] text-green font-bold">PRE-SCREENED</span>
</div>
</div>
</div>
</div>
<script>
        // Micro-interaction for live updating integrity score
        let currentScore = 98;
        const scoreElement = document.getElementById('integrity-score');

        function updateScore() {
            const chance = Math.random();
            if (chance > 0.8) {
                // Occasional minor fluctuation
                const delta = Math.random() > 0.5 ? 1 : -1;
                currentScore = Math.max(92, Math.min(100, currentScore + delta));
                scoreElement.textContent = currentScore;
                
                // Visual feedback
                scoreElement.style.transition = 'all 0.3s ease';
                scoreElement.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    scoreElement.style.transform = 'scale(1)';
                }, 300);
            }
        }

        // Timer simulation
        let timeRemaining = 45 * 60 + 12;
        const timerElement = document.getElementById('timer');

        function updateTimer() {
            timeRemaining--;
            const mins = Math.floor(timeRemaining / 60);
            const secs = timeRemaining % 60;
            timerElement.textContent = \`\${mins}:\${secs.toString().padStart(2, '0')} REMAINING\`;
        }

        setInterval(updateScore, 3000);
        setInterval(updateTimer, 1000);

        // Simulated event logger entries
        const logContainer = document.querySelector('.custom-scrollbar');
        const eventTypes = [
            { type: 'info', icon: 'visibility', text: 'Gaze orientation verified.' },
            { type: 'info', icon: 'keyboard', text: 'Keystroke dynamics verified.' },
            { type: 'success', icon: 'lock', text: 'Encrypted packet transmitted.' }
        ];

        function addLog() {
            const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
            
            const div = document.createElement('div');
            div.className = \`p-3 rounded bg-white/5 border-l-2 \${event.type === 'info' ? 'border-secondary/50' : 'border-green/50'} flex flex-col gap-1 opacity-0 transform translate-y-4 transition-all duration-500\`;
            div.innerHTML = \`
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-data-md \${event.type === 'info' ? 'text-secondary' : 'text-green'}">\${time}</span>
                    <span className="material-symbols-outlined text-[14px] \${event.type === 'info' ? 'text-secondary' : 'text-green'}">\${event.icon}</span>
                </div>
                <p className="text-xs text-text-secondary">\${event.text}</p>
            \`;
            
            logContainer.insertBefore(div, logContainer.firstChild);
            setTimeout(() => {
                div.classList.remove('opacity-0', 'translate-y-4');
            }, 100);

            // Keep log manageable
            if (logContainer.children.length > 8) {
                logContainer.removeChild(logContainer.lastChild);
            }
        }

        setInterval(() => {
            if (Math.random() > 0.7) addLog();
        }, 8000);

    </script>
`;

export default function E50Page() {
  return (
    <PageContainer>
      <StitchPageEngine
        rawHtml={rawHtml}
        bodyClasses="font-body-md text-body-md select-none"
        nextRoute="/employer/dashboard"
        prevRoute="/employer/dashboard"
      />
    </PageContainer>
  );
}

