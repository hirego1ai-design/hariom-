"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type Role = "CANDIDATE" | "EMPLOYER" | "RECRUITER" | "ADMIN";

type RoleUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  hasCandidateProfile: boolean;
  hasEmployerProfile: boolean;
  companyId: string | null;
};

const PAGE_SIZE = 25;
const roles: Role[] = ["CANDIDATE", "EMPLOYER", "RECRUITER", "ADMIN"];

function eligibleRoles(user: RoleUser): Role[] {
  return roles.filter((role) => {
    if (role === "ADMIN") return true;
    if (role === "EMPLOYER" || role === "RECRUITER") return user.hasEmployerProfile;
    return user.hasCandidateProfile && !user.hasEmployerProfile;
  });
}

export default function AdminRolesPage() {
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [total, setTotal] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [currentAdminId, setCurrentAdminId] = useState("");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [target, setTarget] = useState<RoleUser | null>(null);
  const [nextRole, setNextRole] = useState<Role>("CANDIDATE");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (deferredSearch.trim()) params.set("search", deferredSearch.trim());
      if (roleFilter) params.set("role", roleFilter);

      const response = await fetch(`/api/admin/roles?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error(payload.error || "Unable to load authoritative role assignments.");
      }

      setUsers(payload.data);
      setTotal(typeof payload.total === "number" ? payload.total : 0);
      setAdminCount(typeof payload.adminCount === "number" ? payload.adminCount : 0);
      setCurrentAdminId(typeof payload.currentAdminId === "string" ? payload.currentAdminId : "");
    } catch (cause) {
      setUsers([]);
      setTotal(0);
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load authoritative role assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, roleFilter]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, roleFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleSummary = useMemo(() => {
    const counts = new Map<Role, number>();
    for (const user of users) counts.set(user.role, (counts.get(user.role) || 0) + 1);
    return counts;
  }, [users]);

  function openRoleChange(user: RoleUser) {
    setError("");
    setNotice("");
    setTarget(user);
    setNextRole(user.role);
    setReason("");
  }

  async function saveRoleChange() {
    if (
      !target ||
      saving ||
      target.id === currentAdminId ||
      nextRole === target.role ||
      reason.trim().length < 3
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/roles", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: target.id,
          newRole: nextRole,
          expectedUpdatedAt: target.updatedAt,
          reason: reason.trim(),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Unable to change user role.");
      }

      setNotice(
        `${target.email} role changed from ${target.role} to ${nextRole}. Existing sessions were invalidated by session version.`,
      );
      setTarget(null);
      setReason("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to change user role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <AdminSidebar />
      <div className="min-h-screen md:pl-[116px]">
        <AdminHeader
          title="Roles & Permissions"
          subtitle="Authoritative user roles with audited, session-invalidating changes"
        />

        <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 pt-24 sm:p-6 sm:pt-24 lg:p-8 lg:pt-24">
          <header className="space-y-2">
            <h1 className="text-2xl font-bold sm:text-3xl">Role governance</h1>
            <p className="max-w-4xl text-sm text-text-muted">
              Role changes affect portal access. Self-role changes and last-admin demotion are blocked.
              Employer/recruiter roles require an employer profile; candidate role requires a candidate profile with no employer profile.
            </p>
          </header>

          {notice && (
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {notice}
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Loaded role summary">
            {roles.map((role) => (
              <div key={role} className="rounded-2xl border border-white/10 bg-[#141418] p-4">
                <p className="text-[10px] font-bold uppercase text-text-muted">{role}</p>
                <p className="mt-2 text-2xl font-bold">{visibleSummary.get(role) || 0}</p>
                <p className="mt-1 text-[10px] text-text-muted">on this page</p>
              </div>
            ))}
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
              <p className="text-[10px] font-bold uppercase text-sky-300">Total admins</p>
              <p className="mt-2 text-2xl font-bold text-sky-200">{adminCount}</p>
              <p className="mt-1 text-[10px] text-text-muted">authoritative total</p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#141418]">
            <div className="flex flex-col gap-3 border-b border-white/10 p-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="font-bold">User role assignments</h2>
                <p className="mt-1 text-xs text-text-muted">{total} matching user{total === 1 ? "" : "s"}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="text-xs text-text-muted">
                  Search
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    maxLength={120}
                    placeholder="Name or email"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white sm:w-64"
                  />
                </label>
                <label className="text-xs text-text-muted">
                  Role
                  <select
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#17171b] px-3 py-2 text-sm text-white sm:w-44"
                  >
                    <option value="">All roles</option>
                    {roles.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div role="status" aria-live="polite" className="p-10 text-center text-sm text-text-muted">
                Loading authoritative role assignments…
              </div>
            ) : users.length === 0 && !error ? (
              <div className="p-10 text-center text-sm text-text-muted">
                No users match the current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[940px] w-full text-left text-xs">
                  <thead className="bg-white/[0.03] text-text-muted">
                    <tr>
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Current role</th>
                      <th className="px-5 py-4">Portal profiles</th>
                      <th className="px-5 py-4">Compatibility</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user) => {
                      const isSelf = user.id === currentAdminId;
                      const lastAdminProtected =
                        user.role === "ADMIN" && adminCount <= 1;
                      const eligible = eligibleRoles(user);
                      return (
                        <tr key={user.id}>
                          <td className="px-5 py-4">
                            <p className="font-bold text-white">{user.name}</p>
                            <p className="mt-1 text-text-muted">{user.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-full border border-white/10 px-2.5 py-1 font-bold">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-text-secondary">
                            <p>Candidate: {user.hasCandidateProfile ? "Yes" : "No"}</p>
                            <p className="mt-1">Employer: {user.hasEmployerProfile ? "Yes" : "No"}</p>
                          </td>
                          <td className="px-5 py-4 text-text-muted">
                            {eligible.join(", ")}
                            {lastAdminProtected && (
                              <p className="mt-1 text-amber-300">Last administrator protected</p>
                            )}
                            {isSelf && (
                              <p className="mt-1 text-amber-300">Current session account</p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => openRoleChange(user)}
                              disabled={isSelf}
                              className="rounded-lg border border-white/10 px-3 py-2 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Change role
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-white/10 p-4">
                <button
                  type="button"
                  disabled={loading || page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-text-muted">Page {page} of {totalPages}</span>
                <button
                  type="button"
                  disabled={loading || page >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {target && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-change-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141418] p-6 shadow-2xl"
          >
            <h2 id="role-change-title" className="text-lg font-bold">Change user role?</h2>
            <p className="mt-2 text-sm text-text-secondary">
              Changing the role immediately changes portal authorization and increments the user&apos;s session version, invalidating existing sessions.
            </p>
            <p className="mt-3 break-all text-xs text-text-muted">{target.email}</p>

            <label className="mt-5 block text-xs text-text-muted">
              New role
              <select
                value={nextRole}
                onChange={(event) => setNextRole(event.target.value as Role)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#17171b] p-3 text-sm text-white"
              >
                {eligibleRoles(target).map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>

            {target.role === "ADMIN" && adminCount <= 1 && nextRole !== "ADMIN" && (
              <p className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                The last administrator cannot be demoted.
              </p>
            )}

            <label className="mt-4 block text-xs text-text-muted">
              Change reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Why is this authorization role changing?"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setTarget(null);
                  setReason("");
                }}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  saving ||
                  reason.trim().length < 3 ||
                  nextRole === target.role ||
                  target.id === currentAdminId ||
                  (target.role === "ADMIN" && adminCount <= 1 && nextRole !== "ADMIN")
                }
                onClick={() => void saveRoleChange()}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {saving ? "Saving…" : "Change role & invalidate sessions"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
