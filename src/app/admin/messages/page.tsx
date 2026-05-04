// src/app/admin/messages/page.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import type { ConversationSummaryDto, MessageDto } from "@/types/customer";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */

function customerLabel(c: ConversationSummaryDto): string {
  const name = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return name || c.email || `Customer #${c.customerId}`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const m = Math.floor(diff / 60_000);
  if (m < 1)   return "just now";
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */

export default function AdminMessagesPage() {
  const { getToken } = useAuth();

  const [conversations, setConversations]   = useState<ConversationSummaryDto[]>([]);
  const [selectedId,    setSelectedId]      = useState<number | null>(null);
  const [thread,        setThread]          = useState<MessageDto[]>([]);
  const [loadingList,   setLoadingList]     = useState(true);
  const [loadingThread, setLoadingThread]   = useState(false);
  const [reply,         setReply]           = useState("");
  const [sending,       setSending]         = useState(false);
  const [listError,     setListError]       = useState<string | null>(null);
  const [threadError,   setThreadError]     = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement>(null);

  const adminFetch = useCallback(async (path: string, opts?: RequestInit) => {
    const token = await getToken();
    return fetch(`/admin/api${path}`, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(opts?.headers ?? {}),
      },
    });
  }, [getToken]);

  // Load conversation list — once on mount, plus a manual refresh hook.
  const loadList = useCallback(async () => {
    setListError(null);
    try {
      const res = await adminFetch("/conversations?take=200");
      if (!res.ok) {
        setListError(`Could not load conversations (HTTP ${res.status}).`);
        return;
      }
      const data: ConversationSummaryDto[] = await res.json();
      setConversations(data);
      // Auto-select first conversation when list loads, if none picked yet.
      setSelectedId((curr) => curr ?? data[0]?.customerId ?? null);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoadingList(false);
    }
  }, [adminFetch]);

  // Load thread for a customer. Server marks inbound messages read by default
  // — call this whenever the admin opens a conversation so the badge clears.
  const loadThread = useCallback(async (customerId: number) => {
    setLoadingThread(true);
    setThreadError(null);
    try {
      const res = await adminFetch(`/conversations/${customerId}`);
      if (!res.ok) {
        setThreadError(`Could not load thread (HTTP ${res.status}).`);
        setThread([]);
        return;
      }
      const data: MessageDto[] = await res.json();
      setThread(data);
    } catch (e) {
      setThreadError(e instanceof Error ? e.message : "Network error");
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  }, [adminFetch]);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    if (selectedId == null) { setThread([]); return; }
    loadThread(selectedId);
  }, [selectedId, loadThread]);

  // Scroll to newest message whenever the thread changes.
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  // After loading a thread, optimistically clear that customer's unread count
  // in the sidebar so the row badge disappears without re-fetching the list.
  useEffect(() => {
    if (selectedId == null) return;
    setConversations((cs) =>
      cs.map((c) => c.customerId === selectedId ? { ...c, unreadInboundCount: 0 } : c)
    );
  }, [selectedId, thread.length]);

  const sendReply = async () => {
    if (selectedId == null || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await adminFetch(`/conversations/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim(), reservationId: null }),
      });
      if (res.ok) {
        const newMsg: MessageDto = await res.json();
        setThread((t) => [...t, newMsg]);
        setReply("");
        // Update the sidebar preview without a full reload.
        setConversations((cs) =>
          cs.map((c) =>
            c.customerId === selectedId
              ? {
                  ...c,
                  lastMessageBody:      newMsg.body.slice(0, 200),
                  lastMessageDirection: "Outbound",
                  lastMessageAt:        newMsg.sentAt,
                  totalMessages:        c.totalMessages + 1,
                }
              : c
          )
        );
      } else {
        const text = await res.text().catch(() => "");
        setThreadError(text || `Could not send (HTTP ${res.status}).`);
      }
    } catch (e) {
      setThreadError(e instanceof Error ? e.message : "Network error");
    } finally {
      setSending(false);
    }
  };

  const selected = conversations.find((c) => c.customerId === selectedId) ?? null;

  return (
    <main className="w-full h-[92dvh] px-4 md:px-8 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between flex-shrink-0 mt-4 mb-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Messages
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Customer conversations and reservation inquiries
          </p>
        </div>
        <button
          onClick={() => { setLoadingList(true); loadList(); }}
          className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          Refresh
        </button>
      </header>

      <div className="flex-1 min-h-0 grid border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900"
           style={{ gridTemplateColumns: "320px 1fr" }}>

        {/* ── Sidebar: conversation list ────────────────────── */}
        <aside className="border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0 bg-gray-50 dark:bg-gray-900/50">
          {loadingList ? (
            <div className="p-4 text-sm text-gray-500">Loading…</div>
          ) : listError ? (
            <div className="p-4 text-sm text-red-600">{listError}</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 italic">No conversations yet.</div>
          ) : (
            <ul className="overflow-y-auto flex-1 divide-y divide-gray-200 dark:divide-gray-800">
              {conversations.map((c) => {
                const active = c.customerId === selectedId;
                const hasUnread = c.unreadInboundCount > 0;
                return (
                  <li key={c.customerId}>
                    <button
                      onClick={() => setSelectedId(c.customerId)}
                      className={[
                        "w-full text-left px-4 py-3 transition-colors",
                        active
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800/50",
                      ].join(" ")}
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className={[
                          "text-sm truncate",
                          hasUnread ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-300",
                        ].join(" ")}>
                          {customerLabel(c)}
                        </span>
                        <span className="text-[0.65rem] text-gray-500 shrink-0">
                          {timeAgo(c.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={[
                          "text-xs truncate",
                          hasUnread ? "text-gray-700 dark:text-gray-200" : "text-gray-500 dark:text-gray-400",
                        ].join(" ")}>
                          {c.lastMessageDirection === "Outbound" && (
                            <span className="text-gray-400">You: </span>
                          )}
                          {c.lastMessageBody ?? "—"}
                        </p>
                        {hasUnread && (
                          <span className="shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-blue-600 text-white text-[0.65rem] font-semibold">
                            {c.unreadInboundCount > 99 ? "99+" : c.unreadInboundCount}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ── Thread pane ──────────────────────────────────── */}
        <section className="flex flex-col min-h-0 bg-white dark:bg-gray-900">
          {selected ? (
            <>
              {/* Thread header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {customerLabel(selected)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selected.email} · {selected.totalMessages} {selected.totalMessages === 1 ? "message" : "messages"}
                  </div>
                </div>
              </div>

              {/* Thread body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
                {loadingThread ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : threadError ? (
                  <p className="text-sm text-red-600">{threadError}</p>
                ) : thread.length === 0 ? (
                  <p className="text-sm italic text-gray-500">No messages yet.</p>
                ) : (
                  thread.map((m) => {
                    const isAdmin = m.direction === "Outbound";
                    return (
                      <div key={m.messageId}
                           className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={[
                          "max-w-[75%] rounded-2xl px-4 py-2.5",
                          isAdmin
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
                        ].join(" ")}>
                          <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={[
                            "text-[0.65rem] mt-1",
                            isAdmin ? "text-blue-100" : "text-gray-500 dark:text-gray-400",
                          ].join(" ")}>
                            {isAdmin ? "Noemi" : customerLabel(selected)} · {formatTimestamp(m.sentAt)}
                            {m.reservationId && (
                              <> · <span className="font-medium">RES-{m.reservationId}</span></>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={threadEndRef} />
              </div>

              {/* Composer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-5 py-3">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    rows={2}
                    placeholder="Reply… (⌘/Ctrl + Enter to send)"
                    className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !reply.trim()}
                    className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500 italic">Select a conversation to begin.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
