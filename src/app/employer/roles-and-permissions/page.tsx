"use client";
import React, { useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export interface PermissionModule {
  id: string;
  name: string;
  category: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  admin: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
  permissions: Record<string, { read: boolean; write: boolean; delete: boolean; admin: boolean }>;
}

const initialRoles: Role[] = [
  {
    id: "R-1",
    name: "Super Admin",
    description: "Full uninhibited access to all platform systems, financial data, and security overrides.",
    usersCount: 3,
    permissions: {
      candidates: { read: true, write: true, delete: true, admin: true },
      employers: { read: true, write: true, delete: true, admin: true },
      revenue: { read: true, write: true, delete: true, admin: true },
      aiConfig: { read: true, write: true, delete: true, admin: true },
      systemLogs: { read: true, write: true, delete: true, admin: true },
      rolesMatrix: { read: true, write: true, delete: true, admin: true },
    },
  },
  {
    id: "R-2",
    name: "Compliance Officer",
    description: "Access to candidate verification, risk auditing, and KYC compliance records.",
    usersCount: 8,
    permissions: {
      candidates: { read: true, write: true, delete: false, admin: false },
      employers: { read: true, write: true, delete: false, admin: false },
      revenue: { read: false, write: false, delete: false, admin: false },
      aiConfig: { read: true, write: false, delete: false, admin: false },
      systemLogs: { read: true, write: false, delete: false, admin: false },
      rolesMatrix: { read: false, write: false, delete: false, admin: false },
    },
  },
  {
    id: "R-3",
    name: "Support Lead",
    description: "Customer service tools, ticket escalation, and user account status updates.",
    usersCount: 14,
    permissions: {
      candidates: { read: true, write: true, delete: false, admin: false },
      employers: { read: true, write: true, delete: false, admin: false },
      revenue: { read: true, write: false, delete: false, admin: false },
      aiConfig: { read: false, write: false, delete: false, admin: false },
      systemLogs: { read: true, write: false, delete: false, admin: false },
      rolesMatrix: { read: false, write: false, delete: false, admin: false },
    },
  },
];

const modules = [
  { id: "candidates", name: "Candidate Management", category: "Talent Directory" },
  { id: "employers", name: "Employer & Corporate Accounts", category: "Client Management" },
  { id: "revenue", name: "Financial Ledger & Billing", category: "Finance" },
  { id: "aiConfig", name: "AI Pipeline & Prompts", category: "Core Infrastructure" },
  { id: "systemLogs", name: "Audit Logs & System Health", category: "Security" },
  { id: "rolesMatrix", name: "Roles & Access Control", category: "Administration" },
];

export default function EmployerPageE50() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("R-1");
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const togglePermission = (moduleId: string, action: "read" | "write" | "delete" | "admin") => {
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id !== selectedRoleId) return role;
        const currentPerms = role.permissions[moduleId] || { read: false, write: false, delete: false, admin: false };
        return {
          ...role,
          permissions: {
            ...role.permissions,
            [moduleId]: {
              ...currentPerms,
              [action]: !currentPerms[action],
            },
          },
        };
      })
    );
  };

  const savePermissions = () => {
    triggerToast(`Permissions for '${activeRole.name}' saved successfully!`);
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName) return;

    const created: Role = {
      id: `R-${roles.length + 1}`,
      name: newRoleName,
      description: newRoleDesc || "Custom system role.",
      usersCount: 1,
      permissions: {
        candidates: { read: true, write: false, delete: false, admin: false },
        employers: { read: true, write: false, delete: false, admin: false },
        revenue: { read: false, write: false, delete: false, admin: false },
        aiConfig: { read: false, write: false, delete: false, admin: false },
        systemLogs: { read: true, write: false, delete: false, admin: false },
        rolesMatrix: { read: false, write: false, delete: false, admin: false },
      },
    };

    setRoles([...roles, created]);
    setSelectedRoleId(created.id);
    setNewRoleName("");
    setNewRoleDesc("");
    setShowAddRoleModal(false);
    triggerToast(`Created new role: ${created.name}`);
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-text-primary flex">
      <AdminSidebar />

      <div className="pl-[116px] flex-1 flex flex-col min-h-screen">
        <AdminHeader
          title="Roles & Permissions Control"
          subtitle="Configure Role-Based Access Control (RBAC), security privileges, and administrative overrides."
        />

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {toast}
          </div>
        )}

        <main className="pt-24 p-gutter space-y-stack-lg flex-1 max-w-[1600px] w-full mx-auto">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-bold text-lg text-white">System Security Roles</h2>
              <p className="text-text-muted text-xs">Select a role to edit its active permission matrix across modules.</p>
            </div>

            <button
              onClick={() => setShowAddRoleModal(true)}
              className="h-10 px-5 rounded-full bg-primary hover:bg-primary-light text-xs font-bold text-white flex items-center gap-2 shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_moderator</span>
              Create Custom Role
            </button>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {roles.map((role) => {
              const isSelected = role.id === selectedRoleId;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`glass-card p-5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(255,180,170,0.15)]"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">shield_person</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-text-secondary">
                      {role.usersCount} Active Users
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-white">{role.name}</h3>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{role.description}</p>
                </div>
              );
            })}
          </div>

          {/* Interactive Permission Matrix */}
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">rule</span>
                  Permission Matrix: <span className="text-primary font-bold">{activeRole.name}</span>
                </h3>
                <p className="text-xs text-text-muted">Toggle capabilities to grant or restrict system access.</p>
              </div>

              <button
                onClick={savePermissions}
                className="h-10 px-6 rounded-full bg-green text-black hover:bg-green/90 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                Save Permissions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary">
                <thead className="bg-[#141418] text-text-muted uppercase text-[10px] tracking-wider border-b border-white/10">
                  <tr>
                    <th className="p-4">System Module</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-center">Read (View)</th>
                    <th className="p-4 text-center">Write (Edit)</th>
                    <th className="p-4 text-center">Delete (Remove)</th>
                    <th className="p-4 text-center">Admin (Override)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {modules.map((mod) => {
                    const perm = activeRole.permissions[mod.id] || { read: false, write: false, delete: false, admin: false };
                    return (
                      <tr key={mod.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          {mod.name}
                        </td>
                        <td className="p-4 text-text-muted">{mod.category}</td>

                        {(["read", "write", "delete", "admin"] as const).map((action) => (
                          <td key={action} className="p-4 text-center">
                            <button
                              onClick={() => togglePermission(mod.id, action)}
                              className={`w-10 h-6 rounded-full transition-all p-1 relative ${
                                perm[action] ? "bg-primary" : "bg-white/10"
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                  perm[action] ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#17171C] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create Custom Security Role</h3>
            <form onSubmit={handleCreateRole} className="space-y-3">
              <div>
                <label className="text-xs text-text-secondary block mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Regional Auditor"
                  className="w-full h-10 rounded-xl bg-[#1E1E1E] border border-white/10 px-3 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary block mb-1">Role Description</label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="Describe scope of responsibilities..."
                  className="w-full h-20 rounded-xl bg-[#1E1E1E] border border-white/10 p-3 text-xs text-white resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoleModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-text-muted hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-light"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
