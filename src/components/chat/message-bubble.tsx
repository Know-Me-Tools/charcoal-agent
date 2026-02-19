import type { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-accent text-accent-foreground"
            : "bg-card text-card-foreground border border-border"
        }`}
      >
        <p className="body-text whitespace-pre-wrap text-[15px]">{message.content}</p>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
          {formatTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

function formatTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}
