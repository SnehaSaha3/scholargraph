"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteResearchConversation,
  getResearchConversation,
  listResearchHistory,
  renameResearchConversation,
  type ResearchConversationSummary,
} from "@/lib/researchApi";

type Props = {
  collapsed?: boolean;
  onMobileClose?: () => void;
};

export default function ConversationHistory({
  collapsed = false,
  onMobileClose,
}: Props) {
  const [items, setItems] = useState<ResearchConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [openingPlanId, setOpeningPlanId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setItems(await listResearchHistory());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load research history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const handleUpdated = () => void refresh();

    const handleActive = (event: Event) => {
      const customEvent = event as CustomEvent<{
        conversationId: string | null;
      }>;

      setActiveId(customEvent.detail?.conversationId ?? null);
    };

    window.addEventListener("scholargraph:history-updated", handleUpdated);
    window.addEventListener("scholargraph:conversation-active", handleActive);

    return () => {
      window.removeEventListener(
        "scholargraph:history-updated",
        handleUpdated
      );
      window.removeEventListener(
        "scholargraph:conversation-active",
        handleActive
      );
    };
  }, [refresh]);

  
  function newChat() {
    setActiveId(null);
    setMenuId(null);
    setEditingId(null);
    setError("");

    window.history.replaceState(
      {},
      "",
      window.location.pathname
    );

    window.dispatchEvent(
      new CustomEvent("scholargraph:new-research")
    );

    window.dispatchEvent(
      new CustomEvent("scholargraph:conversation-active", {
        detail: { conversationId: null },
      })
    );

    onMobileClose?.();
  }


  
  function openConversation(id: string) {
    setActiveId(id);
    setMenuId(null);
    setEditingId(null);
    setError("");

    onMobileClose?.();

    window.location.assign(
      `/workspace?conversationId=${encodeURIComponent(id)}`
    );
  }


  async function viewPlan(item: ResearchConversationSummary) {
    setMenuId(null);
    setError("");
    setOpeningPlanId(item.id);

    try {
      const conversation = await getResearchConversation(item.id);

      const hasSavedPlan = conversation.messages.some(
        (message) =>
          message.role === "assistant" &&
          message.kind === "plan" &&
          message.payload !== null &&
          typeof message.payload === "object"
      );

      if (!hasSavedPlan) {
        setError(`No saved research plan was found for "${item.title}".`);
        return;
      }

      const plannerUrl = `/planner?conversationId=${encodeURIComponent(
        item.id
      )}`;

      window.location.assign(plannerUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to open the saved research plan."
      );
    } finally {
      setOpeningPlanId(null);
    }
  }

  function startRename(item: ResearchConversationSummary) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setMenuId(null);
    setError("");
  }

  async function saveRename(id: string) {
    const title = editTitle.trim();

    if (!title) {
      setError("A conversation title cannot be empty.");
      return;
    }

    try {
      const updated = await renameResearchConversation(id, title);

      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item))
      );

      setEditingId(null);
      setError("");

      window.dispatchEvent(
        new CustomEvent("scholargraph:history-updated")
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to rename conversation."
      );
    }
  }

  async function removeConversation(item: ResearchConversationSummary) {
    if (!window.confirm(`Delete "${item.title}" and its saved messages?`)) {
      return;
    }

    try {
      await deleteResearchConversation(item.id);

      setItems((current) =>
        current.filter((entry) => entry.id !== item.id)
      );

      setMenuId(null);
      setError("");

      if (activeId === item.id) {
        newChat();
      }

      window.dispatchEvent(
        new CustomEvent("scholargraph:history-updated")
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete conversation."
      );
    }
  }

  return (
    <section className="mt-5 border-t border-white/[0.07] pt-4">
      <div
        className={[
          "mb-3 flex items-center",
          collapsed ? "justify-center" : "justify-between px-2",
        ].join(" ")}
      >
        {!collapsed && (
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
            Recent research
          </p>
        )}

        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          title="Refresh history"
          aria-label="Refresh history"
          className="rounded-lg p-2 text-white/35 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      <button
        type="button"
        onClick={newChat}
        title={collapsed ? "New Chat" : undefined}
        className={[
          "flex min-h-10 w-full items-center rounded-xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-100 hover:bg-violet-300/[0.12]",
          collapsed ? "justify-center px-2" : "gap-2 px-3",
        ].join(" ")}
      >
        <Plus size={16} />
        {!collapsed && (
          <span className="text-xs font-medium">New Chat</span>
        )}
      </button>

      {error && !collapsed && (
        <p
          role="alert"
          className="mt-2 break-words px-2 text-xs text-red-300"
        >
          {error}
        </p>
      )}

      {!collapsed && (
        <div className="mt-3 space-y-1">
          {loading && items.length === 0 && (
            <p className="px-2 py-3 text-xs text-white/30">
              Loading history…
            </p>
          )}

          {!loading && items.length === 0 && (
            <p className="px-2 py-3 text-xs leading-5 text-white/30">
              Your research conversations will appear here.
            </p>
          )}

          {items.map((item) => (
            <div
              key={item.id}
              className={[
                "group relative flex items-start gap-2 rounded-xl px-2 py-2",
                activeId === item.id
                  ? "bg-white/[0.08] text-white"
                  : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => openConversation(item.id)}
                title={item.title}
                className="flex min-w-0 flex-1 items-start gap-2 text-left"
              >
                <MessageSquare
                  size={15}
                  className="mt-0.5 shrink-0"
                />

                <span className="min-w-0 flex-1 truncate text-xs leading-5">
                  {item.title}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setMenuId((current) =>
                    current === item.id ? null : item.id
                  )
                }
                aria-label={`Options for ${item.title}`}
                aria-expanded={menuId === item.id}
                className="shrink-0 rounded-md p-1 text-white/30 hover:bg-white/[0.08] hover:text-white"
              >
                <MoreHorizontal size={15} />
              </button>

              {menuId === item.id && (
                <div className="absolute right-1 top-9 z-20 w-40 rounded-xl border border-white/10 bg-[#171920] p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => void viewPlan(item)}
                    disabled={openingPlanId === item.id}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-violet-200 hover:bg-white/[0.06] disabled:cursor-wait disabled:opacity-50"
                  >
                    <BookOpen size={13} />
                    {openingPlanId === item.id
                      ? "Opening plan…"
                      : "View Plan"}
                  </button>

                  <button
                    type="button"
                    onClick={() => startRename(item)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70 hover:bg-white/[0.06]"
                  >
                    <Pencil size={13} />
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={() => void removeConversation(item)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-300 hover:bg-white/[0.06]"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              )}

              {editingId === item.id && (
                <div className="absolute left-0 right-0 top-0 z-30 rounded-xl border border-white/10 bg-[#171920] p-2 shadow-xl">
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(event) =>
                      setEditTitle(event.target.value)
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        void saveRename(item.id);
                      }

                      if (event.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    maxLength={255}
                    aria-label="Conversation title"
                    className="w-full rounded-lg border border-white/10 bg-black/20 px-2 py-2 text-xs text-white outline-none focus:border-violet-300/50"
                  />

                  <div className="mt-2 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel rename"
                      className="rounded-md p-2 text-white/40 hover:bg-white/[0.06]"
                    >
                      <X size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => void saveRename(item.id)}
                      className="rounded-md bg-violet-300/15 px-3 py-2 text-xs text-violet-100 hover:bg-violet-300/25"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
