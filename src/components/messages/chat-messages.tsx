"use client";

import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getFirebaseDb, ensureFirebaseAuth } from "@/lib/firebase/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getStatusColor, getStatusLabel, type JobStatus } from "@/lib/types/job";
import { ArrowLeft } from "lucide-react";

interface ChatMessagesProps {
  jobId: string;
  jobTitle: string;
  jobStatus: JobStatus;
  otherUserName: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  createdAt?: { seconds: number; nanoseconds: number } | Date;
  readBy?: string[];
}

export function ChatMessages({ jobId, jobTitle, jobStatus, otherUserName }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    (async () => {
      const db = getFirebaseDb();
      if (!db) return;
      await ensureFirebaseAuth();
      const q = query(collection(db, "chats", jobId, "messages"), orderBy("createdAt", "asc"));
      unsub = onSnapshot(q, snap => {
        const msgs = snap.docs.map(doc => {
          const data = doc.data() as Omit<Message, "id">;
          return { id: doc.id, ...data };
        });
        setMessages(msgs);
      });
    })();
    return () => {
      if (unsub) unsub();
    };
  }, [jobId]);

  useEffect(() => {
    const markAsRead = async () => {
      if (!document.hasFocus()) return;
      const db = getFirebaseDb();
      if (!db || !session?.user?.id) return;
      await ensureFirebaseAuth();
      const unread = messages.filter(
        m => m.receiverId === session.user!.id && !(m.readBy || []).includes(session.user!.id)
      );
      await Promise.all(
        unread.map(m =>
          updateDoc(doc(db, "chats", jobId, "messages", m.id), {
            readBy: arrayUnion(session.user!.id)
          })
        )
      );
    };
    window.addEventListener("focus", markAsRead);
    markAsRead();
    return () => window.removeEventListener("focus", markAsRead);
  }, [messages, jobId, session?.user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, text: input })
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { message?: string });
        throw new Error(body?.message || "Failed to send message");
      }
      setInput("");
    } catch (err) {
      toast.error("Error sending message", {
        description: err instanceof Error ? err.message : "Please try again."
      });
    } finally {
      setSending(false);
    }
  };

  const jobLink =
    session?.user?.role === "customer"
      ? `/dashboard/customer/jobs/${jobId}`
      : `/dashboard/tradesperson/job-board/${jobId}`;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-3">
          <Link href={jobLink}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-semibold text-lg">{jobTitle}</h2>
            <p className="text-sm text-muted-foreground">Chat with {otherUserName}</p>
          </div>
        </div>
        <Badge className={getStatusColor(jobStatus)}>{getStatusLabel(jobStatus)}</Badge>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.map(m => (
          <div
            key={m.id}
            className={`max-w-xs rounded p-2 text-sm ${m.senderId === session?.user?.id ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}>
            {m.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* --- THIS IS THE FIX --- */}
      {/* Changed p-4 to px-4 pt-4 pb-6 to add extra padding at the bottom */}
      <div className="flex gap-2 px-4 pt-4 pb-6 border-t bg-card">
        <input
          className="flex-1 border rounded p-2 bg-background"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message"
          aria-label="Message text"
        />
        <button
          type="button"
          aria-label="Send message"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded disabled:opacity-50">
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
