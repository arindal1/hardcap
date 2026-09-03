"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useArchivedGroups, useDashboardSummary, useGroups } from "@/lib/queries";
import { apiFetch, ApiError } from "@/lib/api-client";
import { NeuInput } from "@/components/NeuInput";
import { NeuSelect } from "@/components/NeuSelect";
import { NeuButton } from "@/components/NeuButton";
import { ScrollReveal } from "@/components/ScrollReveal";
import { GROUP_COLOR_KEYS, GROUP_ICONS, groupColor } from "@/lib/group-style";

function currency(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const { data: summary } = useDashboardSummary();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [budgetCap, setBudgetCap] = useState("");
  const [color, setColor] = useState<string>("gold");
  const [icon, setIcon] = useState<string>(GROUP_ICONS[0]);
  const [rolloverEnabled, setRolloverEnabled] = useState(false);
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictGroupId, setConflictGroupId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCap, setEditCap] = useState("");
  const [editColor, setEditColor] = useState<string>("gold");
  const [editIcon, setEditIcon] = useState<string>(GROUP_ICONS[0]);
  const [editRolloverEnabled, setEditRolloverEnabled] = useState(false);
  const [editIsEmergencyFund, setEditIsEmergencyFund] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const { data: archivedGroups } = useArchivedGroups(showArchived);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConflictGroupId(null);
    try {
      await apiFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name, budgetCap: Number(budgetCap), color, icon, rolloverEnabled, isEmergencyFund }),
      });
      setName("");
      setBudgetCap("");
      setColor("gold");
      setIcon(GROUP_ICONS[0]);
      setRolloverEnabled(false);
      setIsEmergencyFund(false);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (err) {
      if (err instanceof ApiError && err.archivedGroupId) {
        setConflictGroupId(err.archivedGroupId);
      }
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/groups/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  async function handleRestore(id: string) {
    setError(null);
    try {
      await apiFetch(`/api/groups/${id}/restore`, { method: "POST" });
      setConflictGroupId(null);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore group");
    }
  }

  async function handleHardDelete(id: string, name: string) {
    if (!window.confirm(`Permanently delete "${name}" and all of its logged expenses? This cannot be undone.`)) {
      return;
    }
    setError(null);
    try {
      await apiFetch(`/api/groups/${id}/permanent`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete group");
    }
  }

  function startEdit(
    id: string,
    currentName: string,
    currentCap: number,
    currentColor: string,
    currentIcon: string,
    currentRollover: boolean,
    currentIsEmergencyFund: boolean
  ) {
    setEditingId(id);
    setEditName(currentName);
    setEditCap(String(currentCap));
    setEditColor(currentColor);
    setEditIcon(currentIcon);
    setEditRolloverEnabled(currentRollover);
    setEditIsEmergencyFund(currentIsEmergencyFund);
  }

  async function handleEditSave(id: string) {
    setError(null);
    try {
      await apiFetch(`/api/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          budgetCap: Number(editCap),
          color: editColor,
          icon: editIcon,
          rolloverEnabled: editRolloverEnabled,
          isEmergencyFund: editIsEmergencyFund,
        }),
      });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="eyebrow">01 - Budget groups</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl italic text-(--color-text-primary) sm:text-5xl">
          Where the caps live.
        </h1>
        {summary && (
          <p className="mt-3 text-sm text-(--color-text-muted)">
            Unallocated income: {currency(summary.unallocatedIncome)}
          </p>
        )}
      </section>

      <form onSubmit={handleCreate} className="neu-raised flex flex-col gap-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <NeuInput label="Group name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <NeuInput
            label="Budget cap"
            type="number"
            min="0.01"
            step="0.01"
            value={budgetCap}
            onChange={(e) => setBudgetCap(e.target.value)}
            required
          />
          <NeuSelect label="Color" value={color} onChange={(e) => setColor(e.target.value)}>
            {GROUP_COLOR_KEYS.map((key) => (
              <option key={key} value={key}>
                {key[0].toUpperCase() + key.slice(1)}
              </option>
            ))}
          </NeuSelect>
          <NeuSelect label="Icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
            {GROUP_ICONS.map((glyph) => (
              <option key={glyph} value={glyph}>
                {glyph}
              </option>
            ))}
          </NeuSelect>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-6">
            <label className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
              <input
                type="checkbox"
                checked={rolloverEnabled}
                onChange={(e) => setRolloverEnabled(e.target.checked)}
                className="focus-ring h-4 w-4 accent-(--color-accent)"
              />
              Roll over unspent cap
            </label>
            <label className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
              <input
                type="checkbox"
                checked={isEmergencyFund}
                onChange={(e) => setIsEmergencyFund(e.target.checked)}
                className="focus-ring h-4 w-4 accent-(--color-accent)"
              />
              Emergency Fund (absorbs other groups' overage)
            </label>
          </div>
          <NeuButton type="submit" variant="accent" className="w-full sm:w-auto">
            Add group
          </NeuButton>
        </div>
      </form>
      {error && (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-(--color-danger)">{error}</p>
          {conflictGroupId && (
            <NeuButton type="button" onClick={() => handleRestore(conflictGroupId)} className="text-sm">
              Restore archived group instead
            </NeuButton>
          )}
        </div>
      )}


      {isLoading ? (
        <p className="text-(--color-text-muted)">Loading…</p>
      ) : (
        <ScrollReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger>
          {groups?.map((group) =>
            editingId === group.id ? (
              <div key={group.id} className="neu-raised flex flex-col gap-3 p-6">
                <NeuInput label="Group name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <NeuInput
                  label="Budget cap"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editCap}
                  onChange={(e) => setEditCap(e.target.value)}
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <NeuSelect label="Color" value={editColor} onChange={(e) => setEditColor(e.target.value)}>
                      {GROUP_COLOR_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {key[0].toUpperCase() + key.slice(1)}
                        </option>
                      ))}
                    </NeuSelect>
                  </div>
                  <div className="flex-1">
                    <NeuSelect label="Icon" value={editIcon} onChange={(e) => setEditIcon(e.target.value)}>
                      {GROUP_ICONS.map((glyph) => (
                        <option key={glyph} value={glyph}>
                          {glyph}
                        </option>
                      ))}
                    </NeuSelect>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
                  <input
                    type="checkbox"
                    checked={editRolloverEnabled}
                    onChange={(e) => setEditRolloverEnabled(e.target.checked)}
                    className="focus-ring h-4 w-4 accent-(--color-accent)"
                  />
                  Roll over unspent cap
                </label>
                <label className="flex items-center gap-2 text-xs text-(--color-text-secondary)">
                  <input
                    type="checkbox"
                    checked={editIsEmergencyFund}
                    onChange={(e) => setEditIsEmergencyFund(e.target.checked)}
                    className="focus-ring h-4 w-4 accent-(--color-accent)"
                  />
                  Emergency Fund
                </label>
                <div className="flex gap-3">
                  <NeuButton type="button" variant="accent" onClick={() => handleEditSave(group.id)}>
                    Save
                  </NeuButton>
                  <NeuButton type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </NeuButton>
                </div>
              </div>
            ) : (
              <div key={group.id} className="neu-raised neu-pressable flex flex-col gap-2 p-6 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex min-w-0 items-center gap-2 truncate font-medium">
                    <span aria-hidden>{group.icon}</span>
                    <span className="truncate">{group.name}</span>
                    {group.isEmergencyFund && (
                      <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide text-(--color-accent-strong)">
                        🛡️ EF
                      </span>
                    )}
                  </h3>
                  <div className="flex shrink-0 gap-3">
                    <button
                      onClick={() =>
                        startEdit(
                          group.id,
                          group.name,
                          group.baseCap,
                          group.color,
                          group.icon,
                          group.rolloverEnabled,
                          group.isEmergencyFund
                        )
                      }
                      className="focus-ring text-xs text-(--color-text-muted) hover:text-(--color-accent)"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="focus-ring text-xs text-(--color-text-muted) hover:text-(--color-danger)"
                    >
                      Archive
                    </button>
                  </div>
                </div>
                <p className="tabular text-sm text-(--color-text-secondary)">
                  Cap: {group.cap.toLocaleString()} · Remaining: {group.remaining.toLocaleString()}
                </p>
                {group.rolloverEnabled && (
                  <p className="text-xs" style={{ color: groupColor(group.color).accent }}>
                    Rollover on{group.rolloverAmount > 0 ? ` · +${currency(group.rolloverAmount)} carried in` : ""}
                  </p>
                )}
                {group.isEmergencyFund && group.drawnFromOverage > 0 && (
                  <p className="text-xs text-(--color-danger)">
                    Drawn: {currency(group.drawnFromOverage)} to cover other groups&apos; overage
                  </p>
                )}
              </div>
            )
          )}
        </ScrollReveal>
      )}

      <section className="flex flex-col gap-4">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="focus-ring w-fit text-xs text-(--color-text-muted) hover:text-(--color-accent)"
        >
          {showArchived ? "Hide archived groups" : "Show archived groups"}
        </button>
        {showArchived && (
          <div className="flex flex-col gap-3">
            {archivedGroups?.length ? (
              archivedGroups.map((group) => (
                <div key={group.id} className="neu-raised flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{group.name}</p>
                    <p className="text-xs text-(--color-text-muted)">Cap: {currency(group.budgetCap)}</p>
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <NeuButton type="button" onClick={() => handleRestore(group.id)} className="text-sm">
                      Restore
                    </NeuButton>
                    <NeuButton
                      type="button"
                      onClick={() => handleHardDelete(group.id, group.name)}
                      className="text-sm text-(--color-danger)"
                    >
                      Delete permanently
                    </NeuButton>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-(--color-text-muted)">No archived groups.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}