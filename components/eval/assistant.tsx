"use client";
import { useEffect, useState } from "react";
import { Sparkles, Send, Paperclip, X, Check } from "lucide-react";
import type { SampleData } from "@/lib/eval/report-data";
import { applyChanges, type SuggestedChange } from "@/lib/eval/changes";
import { evalRequest } from "./shared";
type Message = {
  id: string;
  role: string;
  content: string;
  image_urls: string[];
  created_at: string;
};
export function Assistant({
  id,
  data,
  saved,
  busy,
  setBusy,
  onApply,
  onClose,
}: {
  id: string;
  data: SampleData;
  saved: boolean;
  busy: string;
  setBusy: (value: string) => void;
  onApply: (data: SampleData) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [images, setImages] = useState<{ path: string; url: string }[]>([]);
  const [proposal, setProposal] = useState<{
    changes: SuggestedChange[];
    base: string;
  } | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  async function load() {
    if (saved) setMessages(await evalRequest<Message[]>(`chat/${id}`));
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id, saved]);
  async function send() {
    setError("");
    setBusy("Preparing AI suggestions…");
    const snapshot = JSON.stringify(data);
    try {
      const response = await evalRequest<{
        reply: string;
        changes: SuggestedChange[];
      }>("ai", {
        method: "POST",
        body: JSON.stringify({
          reportId: id,
          message: input,
          content: data,
          imagePaths: images.map((i) => i.path),
        }),
      });
      setInput("");
      setImages([]);
      setProposal(
        response.changes.length
          ? { changes: response.changes, base: snapshot }
          : null,
      );
      setSelected(response.changes.map((_, i) => i));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <aside className="eval-assistant no-print" aria-label="AI assistant">
      <header>
        <div>
          <Sparkles size={19} />
          <strong>AI assistant</strong>
        </div>
        <button
          className="eval-icon-button"
          aria-label="Close assistant"
          disabled={!!busy}
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      <p className="eval-assistant-intro">
        Ask about this draft, check a conversion, or suggest clearer wording.
        You choose which changes to apply.
      </p>
      {!saved && (
        <p className="eval-alert">Save this report to start a conversation.</p>
      )}
      <div className="eval-messages" aria-live="polite">
        {!messages.length && (
          <div className="eval-assistant-empty">
            <Sparkles size={28} />
            <h3>A second look, when you need it.</h3>
            <p>“Check this report for missing information.”</p>
            <p>“Explain the credit conversion.”</p>
          </div>
        )}
        {messages.map((message) => (
          <article className={`eval-message ${message.role}`} key={message.id}>
            <small>{message.role === "user" ? "You" : "AET assistant"}</small>
            <p>{message.content}</p>
            {message.image_urls?.map((url, i) => (
              <a href={url} target="_blank" rel="noreferrer" key={i}>
                <img
                  src={url}
                  alt={`Attached source image ${i + 1}`}
                  loading="lazy"
                />
              </a>
            ))}
          </article>
        ))}
      </div>
      {proposal && (
        <div className="eval-ai-proposals">
          <h3>Suggested changes</h3>
          {proposal.changes.map((change, i) => (
            <label key={i}>
              <input
                type="checkbox"
                checked={selected.includes(i)}
                onChange={(e) =>
                  setSelected(
                    e.target.checked
                      ? [...selected, i]
                      : selected.filter((n) => n !== i),
                  )
                }
              />
              <span>
                <strong>{change.path}</strong>
                <em>{change.value}</em>
                <small>{change.reason}</small>
              </span>
            </label>
          ))}
          <button
            className="eval-button"
            disabled={
              !!busy ||
              !selected.length ||
              proposal.base !== JSON.stringify(data)
            }
            onClick={() => {
              onApply(
                applyChanges(
                  data,
                  proposal.changes.filter((_, i) => selected.includes(i)),
                ),
              );
              setProposal(null);
            }}
          >
            <Check size={16} />
            Apply selected to draft
          </button>
          {proposal.base !== JSON.stringify(data) && (
            <p>The draft has changed. Ask again for up-to-date suggestions.</p>
          )}
          <button
            className="eval-text-button"
            onClick={() => setProposal(null)}
          >
            Dismiss suggestions
          </button>
        </div>
      )}
      {error && (
        <p className="eval-alert" role="alert">
          {error}
        </p>
      )}
      <form
        className="eval-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <label className="eval-sr-only" htmlFor="eval-prompt">
          Message to AI assistant
        </label>
        <textarea
          id="eval-prompt"
          maxLength={8000}
          rows={3}
          placeholder="Ask about this report…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!!busy || !saved}
        />
        {images.map((image, i) => (
          <div className="eval-upload-chip" key={image.path}>
            <img src={image.url} alt={`Image ${i + 1}`} />
            <button
              type="button"
              aria-label={`Remove image ${i + 1}`}
              onClick={() => setImages(images.filter((_, j) => j !== i))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <div className="eval-composer-actions">
          <label className="eval-attach">
            <Paperclip size={16} />
            <span>Image</span>
            <input
              aria-label="Attach image to AI message"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={!!busy || !saved || images.length >= 3}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy("Uploading image…");
                setError("");
                try {
                  const body = new FormData();
                  body.append("file", file);
                  const result = await evalRequest<{
                    path: string;
                    url: string;
                  }>(`attachments?reportId=${id}`, { method: "POST", body });
                  setImages([...images, result]);
                } catch (error) {
                  setError((error as Error).message);
                } finally {
                  setBusy("");
                  e.target.value = "";
                }
              }}
            />
          </label>
          <button
            className="eval-button primary"
            disabled={!!busy || !saved || !input.trim()}
          >
            <Send size={16} />
            Send
          </button>
        </div>
        <small>
          Messages and attached images are processed by Gemini. Suggestions
          require your review.
        </small>
      </form>
    </aside>
  );
}
