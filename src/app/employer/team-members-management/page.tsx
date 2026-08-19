"use client";
import React, { useState, useEffect } from "react";
import { PageContainer, PageHeader, Modal, FormGroup, FormInput, FormSelect } from "@/components/employer/LayoutSystem";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance";
  joinedDate: string;
  avatarUrl?: string;
  avatarFallback?: string;
}

export default function EmployerTeamManagementPage() {
  const [activeSessionRole, setActiveSessionRole] = useState<"Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance">("Admin");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Inviting
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Recruiter" | "Interviewer" | "Viewer" | "Finance">("Recruiter");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = activeSessionRole === "Admin";

  async function fetchTeam() {
    try {
      const res = await fetch("/api/employer/team");
      const data = await res.json();
      if (data.success && data.team) {
        setMembers(
          data.team.map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: (m.role === "ADMIN" ? "Admin" : m.role === "RECRUITER" ? "Recruiter" : "Viewer") as any,
            joinedDate: new Date(m.joinedAt || Date.now()).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
              year: "numeric",
            }),
            avatarFallback: m.name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
          }))
        );
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can invite team members.");
      return;
    }
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    try {
      const res = await fetch("/api/employer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole.toUpperCase(),
          designation: inviteRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newMember: Member = {
          id: data.member?.id || Date.now().toString(),
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          avatarFallback: inviteName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
        };
        setMembers((prev) => [...prev, newMember]);
      }
    } catch (err) {
      console.error("Failed to send invite:", err);
    }

    setInviteName("");
    setInviteEmail("");
    setInviteRole("Recruiter");
    setShowInviteModal(false);
  };

  const handleRemoveMember = async (id: string) => {
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can remove team members.");
      return;
    }
    if (confirm("Are you sure you want to remove this team member?")) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      try {
        await fetch(`/api/employer/team?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      } catch {
        // Ignore
      }
    }
  };

  const filteredMembers = members.filter(
    (m) =>
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
        subtitle="Manage your organization's members, access credentials, and role permissions"
        primaryAction={{
          text: "Invite Team Member",
          onClick: () => setShowInviteModal(true),
          disabled: !isAdmin,
          icon: "person_add",
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
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-500">
                      Loading team members...
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
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
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition-all shadow-lg cursor-pointer"
              >
                Send Invitation
              </button>
            </div>
          }
        >
          <form id="invite-member-form" onSubmit={handleSendInvite} className="space-y-4">
            <FormGroup label="Team Member Name *" required>
              <FormInput
                type="text"
                required
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

            <FormGroup label="Access Role *" required>
              <FormSelect
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
              >
                <option value="Admin">Admin (Full Control, Invite, Remove)</option>
                <option value="Finance">Finance / Accountant (Manage & Pay Invoices)</option>
                <option value="Recruiter">Recruiter (Post requirements & view candidates)</option>
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
