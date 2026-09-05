"use client";
import React, { useState, useEffect } from "react";
import { PageContainer, PageHeader, Modal, FormGroup, FormInput, FormSelect } from "@/components/employer/LayoutSystem";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Recruiter";
  joinedDate: string;
  avatarUrl?: string;
  avatarFallback?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  name: string;
  role: "EMPLOYER" | "RECRUITER";
  designation?: string;
  expiresAt: string;
  createdAt: string;
}

export default function EmployerTeamManagementPage() {
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Inviting
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"EMPLOYER" | "RECRUITER">("RECRUITER");
  const [inviteDesignation, setInviteDesignation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Derive Admin permission from current server session role
  const isAdmin = currentUserRole === "EMPLOYER" || currentUserRole === "ADMIN";

  async function fetchCurrentUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUserRole(data.user.role);
      }
    } catch (err) {
      console.error("Failed to fetch authenticated session:", err);
    }
  }

  async function fetchTeam() {
    try {
      const res = await fetch("/api/employer/team");
      const data = await res.json();
      if (data.success) {
        if (data.team) {
          setMembers(
            data.team.map((m: any) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              role: m.role === "ADMIN" || m.role === "EMPLOYER" ? "Admin" : "Recruiter",
              joinedDate: new Date(m.joinedAt || Date.now()).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              avatarFallback: m.name
                .split(" ")
                .filter(Boolean)
                .map((w: string) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2),
            }))
          );
        }
        if (data.invitations) {
          setInvitations(data.invitations);
        }
      }
    } catch (err) {
      console.error("Failed to load team data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
    fetchTeam();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can invite team members.");
      return;
    }
    if (!inviteEmail.trim() || !inviteName.trim()) return;

    setSubmittingInvite(true);
    try {
      const res = await fetch("/api/employer/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          role: inviteRole,
          designation: inviteDesignation.trim() || (inviteRole === "EMPLOYER" ? "Admin" : "Recruiter"),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send invitation.");
      }

      if (data.success && data.invitation) {
        setInvitations((prev) => [data.invitation, ...prev]);
        setShowInviteModal(false);
        setInviteName("");
        setInviteEmail("");
        setInviteDesignation("");
        setInviteRole("RECRUITER");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send invitation.");
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can remove team members.");
      return;
    }
    if (confirm("Are you sure you want to remove this team member?")) {
      try {
        const res = await fetch(`/api/employer/team?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setMembers((prev) => prev.filter((m) => m.id !== id));
        } else {
          alert(data.error || "Failed to remove team member.");
        }
      } catch (err) {
        alert("An error occurred while removing the team member.");
      }
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    if (!isAdmin) {
      alert("Permission Denied: Only Admins can manage team access.");
      return;
    }
    if (confirm("Are you sure you want to revoke this pending invitation?")) {
      try {
        const res = await fetch(`/api/employer/team?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setInvitations((prev) => prev.filter((inv) => inv.id !== id));
        } else {
          alert(data.error || "Failed to revoke invitation.");
        }
      } catch (err) {
        alert("An error occurred while revoking the invitation.");
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
      case "EMPLOYER":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "Recruiter":
      case "RECRUITER":
        return "bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20";
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
          disabled: !isAdmin || loading,
          icon: "person_add",
        }}
      />

      <PageContainer>
        {!isAdmin && !loading && (
          <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 text-xs rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>View-Only Mode: Only Admin members can invite or revoke team members.</span>
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

        {/* Pending Invitations Section */}
        <div className="mt-8 bg-[#121215] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-slate-400 flex items-center gap-2">
              Pending Invitations
              <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-mono text-xs text-amber-400">
                {invitations.length}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4 font-medium">Invitee Details</th>
                  <th className="px-6 py-4 font-medium">Designation / Role</th>
                  <th className="px-6 py-4 font-medium">Expiration Date</th>
                  {isAdmin && <th className="px-6 py-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-500">
                      Loading pending invitations...
                    </td>
                  </tr>
                ) : invitations.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-6 py-8 text-center text-slate-500 italic">
                      No pending invitations.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-white">{inv.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{inv.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getRoleStyle(inv.role)}`}>
                            {inv.role === "EMPLOYER" ? "Admin" : "Recruiter"}
                          </span>
                          {inv.designation && <span className="text-[10px] text-slate-500">{inv.designation}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {new Date(inv.expiresAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="text-amber-400 hover:text-amber-300 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition-colors"
                          >
                            Revoke
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
          onClose={() => !submittingInvite && setShowInviteModal(false)}
          title="Invite New Team Member"
          footerActions={
            <div className="flex gap-2">
              <button
                type="button"
                disabled={submittingInvite}
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingInvite}
                onClick={() => {
                  const form = document.getElementById("invite-member-form") as HTMLFormElement;
                  if (form) form.requestSubmit();
                }}
                className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:scale-105 transition-all shadow-lg cursor-pointer disabled:opacity-50"
              >
                {submittingInvite ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          }
        >
          <form id="invite-member-form" onSubmit={handleSendInvite} className="space-y-4">
            <FormGroup label="Team Member Name *" required>
              <FormInput
                type="text"
                required
                disabled={submittingInvite}
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. John Doe"
              />
            </FormGroup>

            <FormGroup label="Email Address *" required>
              <FormInput
                type="email"
                required
                disabled={submittingInvite}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="e.g. john@company.com"
              />
            </FormGroup>

            <FormGroup label="Designation / Job Title">
              <FormInput
                type="text"
                disabled={submittingInvite}
                value={inviteDesignation}
                onChange={(e) => setInviteDesignation(e.target.value)}
                placeholder="e.g. Technical Recruiter"
              />
            </FormGroup>

            <FormGroup label="Access Role *" required>
              <FormSelect
                value={inviteRole}
                disabled={submittingInvite}
                onChange={(e) => setInviteRole(e.target.value as any)}
              >
                <option value="RECRUITER">Recruiter (Post requirements & view candidates)</option>
                <option value="EMPLOYER">Admin (Full Control, Invite, Remove)</option>
              </FormSelect>
            </FormGroup>
          </form>
        </Modal>
      </PageContainer>
    </div>
  );
}
