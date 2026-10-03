import type { FC } from "react";
import { ClockIcon, WifiOffIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useChatConnectivityStore, selectChatConnectivity } from "@/stores/chat-connectivity-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { CHAT_OFFLINE_STATES_CONTENT } from "../../../../content/site/chat-offline-states";

/**
 * Thread-level notice for the states FR-27 and FR-28 ask for: the agent is
 * offline (UAR down, budget exhausted, meter unavailable or the kill
 * switch), or the visitor is rate-limited. Renders nothing once the thread
 * is online — a new send attempt already clears the notice
 * (`use-message-stream.ts`). Deliberately outside the message list: these
 * are not per-message failures, so no assistant bubble and no status line
 * or upstream text ever appears in the thread for them.
 */
export const ChatConnectivityBanner: FC = () => {
  const activeThreadId = useThreadRegistryStore((s) => s.activeThreadId);
  const connectivity = useChatConnectivityStore(
    selectChatConnectivity(activeThreadId ?? "__none__"),
  );

  if (connectivity.kind === "online") return null;

  if (connectivity.kind === "offline") {
    const { heading, body, ctaLabel } = CHAT_OFFLINE_STATES_CONTENT.offlineNotice;
    return (
      <Alert className="mx-auto w-full max-w-(--thread-max-width) rounded-lg border-0 bg-warning-soft px-3 py-2.5 text-warning-text">
        <WifiOffIcon className="size-4" aria-hidden="true" />
        <AlertTitle className="font-ui text-sm font-semibold text-warning-text">
          {heading}
        </AlertTitle>
        <AlertDescription className="font-body text-sm text-warning-text">
          {body}
        </AlertDescription>
        <Button
          render={<Link to="/" />}
          variant="link"
          size="sm"
          className="col-start-2 h-auto w-fit justify-self-start p-0 text-sm font-medium text-warning-text underline-offset-2 hover:text-fg focus-cue"
        >
          {ctaLabel}
        </Button>
      </Alert>
    );
  }

  // connectivity.kind === "rate-limited"
  const { withWait, withoutWait } = CHAT_OFFLINE_STATES_CONTENT.rateLimited;
  const message =
    connectivity.retryAfterSeconds !== undefined
      ? withWait(connectivity.retryAfterSeconds)
      : withoutWait;

  return (
    <Alert className="mx-auto w-full max-w-(--thread-max-width) rounded-lg border-0 bg-warning-soft px-3 py-2.5 text-warning-text">
      <ClockIcon className="size-4" aria-hidden="true" />
      <AlertDescription className="font-body text-sm text-warning-text">
        {message}
      </AlertDescription>
    </Alert>
  );
};
