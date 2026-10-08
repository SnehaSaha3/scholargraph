"use client";

import {
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ConversationHistoryProps = {
  collapsed?: boolean;
  onMobileClose?: () => void;
};

const STORAGE_KEY = "scholargraph:conversations";

function createConversationTitle(question: string): string {
  const cleaned = question
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "New research";
  }

  if (cleaned.length <= 42) {
    return cleaned;
  }

  return `${cleaned.slice(0, 42).trim()}…`;
}

function getDateGroup(dateString: string): "Today" | "Yesterday" | "Older" {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Older";
  }

  const now = new Date();

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const target = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (target.getTime() === today.getTime()) {
    return "Today";
  }

  if (target.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }

  return "Older";
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is Conversation =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.updatedAt === "string",
    );
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations),
    );
  } catch {
    // Ignore localStorage failures.
  }
}

export function createConversation(question: string): Conversation {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: createConversationTitle(question),
    createdAt: now,
    updatedAt: now,
  };
}

export function getConversations(): Conversation[] {
  return loadConversations();
}

export function addConversation(question: string): Conversation {
  const conversation = createConversation(question);
  const conversations = loadConversations();

  const updated = [
    conversation,
    ...conversations,
  ].slice(0, 50);

  saveConversations(updated);

  return conversation;
}

export function removeConversation(id: string) {
  const conversations = loadConversations();

  saveConversations(
    conversations.filter(
      (conversation) => conversation.id !== id,
    ),
  );
}

export function clearConversations() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export default function ConversationHistory({
  collapsed = false,
  onMobileClose,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [activeConversation, setActiveConversation] =
    useState<string | null>(null);

  const [menuConversation, setMenuConversation] =
    useState<string | null>(null);

  useEffect(() => {
    setConversations(loadConversations());

    const handleStorage = () => {
      setConversations(loadConversations());
    };

    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, []);

  const groups = useMemo(() => {
    const today: Conversation[] = [];
    const yesterday: Conversation[] = [];
    const older: Conversation[] = [];

    for (const conversation of conversations) {
      const group = getDateGroup(
        conversation.updatedAt,
      );

      if (group === "Today") {
        today.push(conversation);
      } else if (group === "Yesterday") {
        yesterday.push(conversation);
      } else {
        older.push(conversation);
      }
    }

    return {
      today,
      yesterday,
      older,
    };
  }, [conversations]);

  function handleSelect(id: string) {
    setActiveConversation(id);
    setMenuConversation(null);
    onMobileClose?.();

    window.dispatchEvent(
      new CustomEvent(
        "scholargraph:conversation-select",
        {
          detail: {
            conversationId: id,
          },
        },
      ),
    );
  }

  function handleDelete(id: string) {
    removeConversation(id);

    setConversations(
      (current) =>
        current.filter(
          (conversation) =>
            conversation.id !== id,
        ),
    );

    if (activeConversation === id) {
      setActiveConversation(null);

      window.dispatchEvent(
        new CustomEvent(
          "scholargraph:conversation-delete",
          {
            detail: {
              conversationId: id,
            },
          },
        ),
      );
    }

    setMenuConversation(null);
  }

  function renderConversation(
    conversation: Conversation,
  ) {
    const isActive =
      activeConversation === conversation.id;

    return (
      <div
        key={conversation.id}
        className="group relative"
      >
        <button
          type="button"
          onClick={() =>
            handleSelect(conversation.id)
          }
          title={
            collapsed
              ? conversation.title
              : undefined
          }
          className={`
            flex h-9 w-full items-center
            rounded-lg text-left text-[13px]
            transition-colors
            ${
              collapsed
                ? "justify-center px-0"
                : "gap-2.5 px-2.5"
            }
            ${
              isActive
                ? "bg-white/[0.075] text-white"
                : "text-[#8b8f99] hover:bg-white/[0.045] hover:text-[#d5d7dc]"
            }
          `}
        >
          <MessageSquare
            size={15}
            strokeWidth={1.7}
            className="shrink-0"
          />

          {!collapsed && (
            <span className="min-w-0 flex-1 truncate pr-5">
              {conversation.title}
            </span>
          )}
        </button>

        {!collapsed && (
          <button
            type="button"
            aria-label={`Conversation options for ${conversation.title}`}
            onClick={() =>
              setMenuConversation(
                menuConversation ===
                  conversation.id
                  ? null
                  : conversation.id,
              )
            }
            className="
              absolute right-1 top-1/2
              flex h-7 w-7
              -translate-y-1/2
              items-center justify-center
              rounded-md
              text-[#666b75]
              opacity-0
              transition-all
              hover:bg-white/[0.08]
              hover:text-white
              group-hover:opacity-100
            "
          >
            <MoreHorizontal size={15} />
          </button>
        )}

        {menuConversation ===
          conversation.id &&
          !collapsed && (
            <div
              className="
                absolute right-1 top-9 z-50
                w-32 overflow-hidden
                rounded-lg border
                border-white/[0.09]
                bg-[#15181e]
                p-1
                shadow-2xl
              "
            >
              <button
                type="button"
                onClick={() =>
                  handleDelete(
                    conversation.id,
                  )
                }
                className="
                  flex h-8 w-full
                  items-center gap-2
                  rounded-md px-2
                  text-left text-xs
                  text-[#b6bac2]
                  transition-colors
                  hover:bg-red-500/10
                  hover:text-red-300
                "
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="px-3">
        {conversations
          .slice(0, 6)
          .map(renderConversation)}
      </div>
    );
  }

  return (
    <div className="px-3">
      {groups.today.length > 0 && (
        <ConversationGroup
          label="Today"
          conversations={groups.today}
          renderConversation={
            renderConversation
          }
        />
      )}

      {groups.yesterday.length > 0 && (
        <ConversationGroup
          label="Yesterday"
          conversations={groups.yesterday}
          renderConversation={
            renderConversation
          }
        />
      )}

      {groups.older.length > 0 && (
        <ConversationGroup
          label="Older"
          conversations={groups.older}
          renderConversation={
            renderConversation
          }
        />
      )}

      {conversations.length === 0 && (
        <div className="px-2 py-3">
          <p className="text-[11px] leading-5 text-[#555a64]">
            Your research conversations will
            appear here.
          </p>
        </div>
      )}
    </div>
  );
}

type ConversationGroupProps = {
  label: string;
  conversations: Conversation[];
  renderConversation: (
    conversation: Conversation,
  ) => React.ReactNode;
};

function ConversationGroup({
  label,
  conversations,
  renderConversation,
}: ConversationGroupProps) {
  return (
    <section className="mb-5">
      <div className="mb-2 px-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#555a64]">
        {label}
      </div>

      <div className="space-y-0.5">
        {conversations.map(
          renderConversation,
        )}
      </div>
    </section>
  );
}