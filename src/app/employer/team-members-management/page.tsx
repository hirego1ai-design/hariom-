"use client";
import React, { useState } from "react";
import { PageContainer, PageHeader, Card, Table, TableRow, TableCell, Modal, FormGroup, FormInput, FormSelect, StatusBadge } from "@/components/employer/LayoutSystem";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance";
  joinedDate: string;
  avatarUrl?: string;
  avatarFallback?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: "Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance";
  sentTime: string;
}

export default function EmployerTeamManagementPage() {
  // Simulator: user can change active simulation role to test permissions
  const [activeSessionRole, setActiveSessionRole] = useState<"Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance">("Admin");

  // Initial active members state
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      name: "Marcus Thorne",
      email: "m.thorne@hirego.ai",
      role: "Admin",
      joinedDate: "Oct 12, 2023",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDi0VKWc-K9g5WJSgMlcte3iObbsFyLziyHV0LXjiGGWUfwjdk9gbW4U3MTc8HAduVkgH9LKpASGu-CpYK7do_scMSsbCMfRHrJ1rq0792RIIYXireDoSKnOAulFs7_4KTG232ZFuvHf1XgvJCYfz5RQryhf87fXQZgri6ZXpXAy_LLI84yqrKn-AJOXNS-UzOGLfyr41jkHEFRKc5sNE8GVuMkpPT7iI9cU6wSa0Hf5DwjQr6luEtkzgfY_-x3xMjOcrJn7Yvs3-A"
    },
    {
      id: "2",
      name: "Elena Vance",
      email: "elena.v@hirego.ai",
      role: "Recruiter",
      joinedDate: "Jan 04, 2024",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuATe-RMVK14N3EgWtwuvzXfVSjZN8Ywc4031R3noSv7WuKAx5bUJBRRRpM3JT6H9i8XzBHBU0SAOF9r_LC0fFvNFc0L6fXGYJuXBeMcmGy3rsIyy6fOdJGv0bDTTv053woOCOsdDSscBpLvotxwaUiIRCBxBJ4ZAHhS0GOpGflA-CK2lZBHUTrk6EsHVbFpK6ybgFjHW0cO3ZHlq1u9_bzvUx9W7x3aUR2brS2cEz-jOW-OLIWBa3E_-0D7sr_UKWkcixykV-fqOMg"
    },
    {
      id: "3",
      name: "Kenji Sato",
      email: "kenji.s@hirego.ai",
      role: "Interviewer",
      joinedDate: "Feb 15, 2024",
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCXT4NmwF8OBUJHHwRotgOitDSS_VDUBQgYuuGJEp8MGIxqzAGXD8c8PS2u8lIsFfExRdP-Y3WYYArIEFFHoc39f-AZ1lL8Oqo3AWQ5t1URDVmNji8iRzl5lTBcq5ydqYyy--HboqTJSLQWaP1LbJvJwf9RN3YWwyo5G4jS-76tL7HaSDf1_GXfZkFOwrVSNLi05PsN49D62qDTdPp8FvpCiKYllTmTQWTSj5Jh2Njqpg0rLdQ4pX_NaDLDLJopgzv_y5XPjmsZP8g"
    },
    {
      id: "4",
      name: "Sarah Ahmed",
      email: "sarah.a@hirego.ai",
      role: "Viewer",
      joinedDate: "Mar 20, 2024",
      avatarFallback: "SA"
    }
  ]);

  // Initial pending invites state
  const [invitations, setInvitations] = useState<Invitation[]>([
    { id: "101", email: "jason.kim@recruit.co", role: "Recruiter", sentTime: "Sent 2 days ago" },
    { id: "102", email: "claire.dev@hirego.ai", role: "Interviewer", sentTime: "Sent 5 days ago" }
  ]);

  // Modal State for Inviting
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance">("Recruiter");

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = activeSessionRole === "Admin";

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can invite team members.");
      return;
    }
    if (!inviteEmail.trim()) return;

    if (inviteName.trim()) {
      const newMember: Member = {
        id: Date.now().toString(),
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        avatarFallback: inviteName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
      };
      setMembers(prev => [...prev, newMember]);
      alert(`Success! ${inviteName} added to organization as ${inviteRole}.`);
    } else {
      const newInvite: Invitation = {
        id: Date.now().toString(),
        email: inviteEmail.trim(),
        role: inviteRole,
        sentTime: "Sent just now"
      };
      setInvitations(prev => [...prev, newInvite]);
      alert(`Success! Invitation sent to ${inviteEmail} as ${inviteRole}.`);
    }

    setInviteName("");
    setInviteEmail("");
    setInviteRole("Recruiter");
    setShowInviteModal(false);
  };

  const handleRemoveMember = (id: string) => {
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can remove team members.");
      return;
    }
    if (confirm("Are you sure you want to remove this team member?")) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleCancelInvite = (id: string) => {
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can cancel invitations.");
      return;
    }
    setInvitations(prev => prev.filter(inv => inv.id !== id));
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleStyle = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "Recruiter":
        return "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20";
      case "Interviewer":
        return "bg-[#30D158]/10 text-[#30D158] border border-[#30D158]/20";
      case "Finance":
        return "bg-[#BF5AF2]/10 text-[#BF5AF2] border border-[#BF5AF2]/20";
      default:
        return "bg-white/5 text-slate-400 border border-white/10";
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader 
        title="Team Management" 
        subtitle="Manage your organization's members, access credentials, and billing management roles" 
        primaryAction={{
          text: "Invite Team Member",
          onClick: () => setShowInviteModal(true),
          disabled: !isAdmin,
          icon: "person_add"
        }}
      />

      <PageContainer>
          {/* Permission Simulator Notification Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#16161B] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <span className="material-symbols-outlined text-base">shield_person</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Simulate Access Permissions</h4>
                <p className="text-[10px] text-slate-400">Toggle active user session role to preview interface constraints</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Active Role:</span>
              <select
                value={activeSessionRole}
                onChange={(e) => setActiveSessionRole(e.target.value as any)}
                className="bg-[#121215] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-[#29B6F6]"
              >
                <option value="Admin">Admin (Full Access)</option>
                <option value="Finance">Finance / Accountant</option>
                <option value="Recruiter">Recruiter</option>
                <option value="Interviewer">Interviewer</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>

          {!isAdmin && (
            <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/20 text-yellow text-xs rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>View-Only Mode: You are logged in as a <strong>{activeSessionRole}</strong>. Only <strong>Admin</strong> members can invite or delete team members.</span>
            </div>
          )}

      <div className="bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
            Active Members
            <span className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-mono text-xs text-indigo-400">
              {filteredMembers.length}
            </span>
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members..."
              className="bg-[#16161B] border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-[#29B6F6] w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-medium">Member Profile</th>
                <th className="px-6 py-4 font-medium">System Role</th>
                <th className="px-6 py-4 font-medium">Registration Date</th>
                {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-500 italic">
                    No active members found matching your search.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex items-center justify-center text-slate-200">
                          {m.avatarUrl ? (
                            <img className="w-full h-full object-cover" src={m.avatarUrl} alt={m.name} />
                          ) : (
                            <span className="font-bold tracking-wide text-xs">{m.avatarFallback}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-white">{m.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRoleStyle(m.role)}`}>
                        {m.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{m.joinedDate}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="bg-[#121215] border border-white/10 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400">Pending System Invitations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invitations.length === 0 ? (
            <div className="col-span-full py-6 text-center text-slate-500 italic text-xs">
              No pending invitations active.
            </div>
          ) : (
            invitations.map((inv) => (
              <div key={inv.id} className="bg-[#16161B] border border-white/5 p-4 rounded-xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <span className="material-symbols-outlined text-base">mail</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs">{inv.email}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{inv.sentTime}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${getRoleStyle(inv.role)}`}>
                    {inv.role}
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex gap-2 border-t border-white/5 pt-3">
                    <button
                      onClick={() => alert(`Resent invitation to ${inv.email}`)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-all"
                    >
                      Resend
                    </button>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="flex-1 py-1.5 bg-red-950/20 text-red-400 hover:text-red-400/80 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite New Team Member"
        footerActions={
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => setShowInviteModal(false)} 
              className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => {
                const form = document.getElementById("invite-member-form") as HTMLFormElement;
                if (form) form.requestSubmit();
              }}
              className="px-5 py-2 bg-[#29B6F6] text-white text-xs font-bold rounded-xl hover:bg-[#29B6F6]/90 transition-all shadow-lg cursor-pointer"
            >
              Send Invitation
            </button>
          </div>
        }
      >
        <form id="invite-member-form" onSubmit={handleSendInvite} className="space-y-4">
          <FormGroup label="Stakeholder Name (Optional)" helperText="If provided, the user skips invitation flow and joins instantly">
            <FormInput
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </FormGroup>

          <FormGroup label="Email Address *" required>
            <FormInput
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="e.g. john@company.com"
            />
          </FormGroup>

          <FormGroup label="Access Role Wise Scope *" required>
            <FormSelect
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as any)}
            >
              <option value="Admin">Admin (Full Control, Invite, Remove)</option>
              <option value="Finance">Finance / Accountant (Manage & Pay Invoices)</option>
              <option value="Recruiter">Recruiter (Post requirements & view scorecards)</option>
              <option value="Interviewer">Interviewer (Assess candidates & review reports)</option>
              <option value="Viewer">Viewer (Read-only access)</option>
            </FormSelect>
          </FormGroup>
        </form>
      </Modal>

        </PageContainer>
    </div>
  );
}
