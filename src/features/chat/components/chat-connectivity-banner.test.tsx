import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { CHAT_OFFLINE_STATES_CONTENT } from "../../../../content/site/chat-offline-states";
import { COMPOSER_LIMIT_CONTENT } from "../../../../content/site/composer-limit";
import { useChatConnectivityStore } from "@/stores/chat-connectivity-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { ChatConnectivityBanner } from "./chat-connectivity-banner";

const THREAD = "thread-banner-test";

function renderBanner() {
  return render(
    <MemoryRouter>
      <ChatConnectivityBanner />
    </MemoryRouter>,
  );
}

afterEach(() => {
  useChatConnectivityStore.getState().clear(THREAD);
  useThreadRegistryStore.setState({ activeThreadId: null });
});

describe("ChatConnectivityBanner", () => {
  it("renders nothing when the thread is online", () => {
    useThreadRegistryStore.setState({ activeThreadId: THREAD });

    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the offline notice and a link to the landing page (FR-27)", () => {
    useThreadRegistryStore.setState({ activeThreadId: THREAD });
    useChatConnectivityStore.getState().setOffline(THREAD);

    renderBanner();

    expect(
      screen.getByText(CHAT_OFFLINE_STATES_CONTENT.offlineNotice.heading),
    ).toBeInTheDocument();
    expect(screen.getByText(CHAT_OFFLINE_STATES_CONTENT.offlineNotice.body)).toBeInTheDocument();
    const link = screen.getByRole("link", {
      name: CHAT_OFFLINE_STATES_CONTENT.offlineNotice.ctaLabel,
    });
    expect(link).toHaveAttribute("href", "/");
  });

  it("shows the budget notice, not the offline one, with status role and a link home", () => {
    useThreadRegistryStore.setState({ activeThreadId: THREAD });
    useChatConnectivityStore.getState().setBudgetExhausted(THREAD);

    renderBanner();

    const c = CHAT_OFFLINE_STATES_CONTENT.budgetExhaustedNotice;
    expect(screen.getByText(c.heading)).toBeInTheDocument();
    expect(screen.getByText(c.body)).toBeInTheDocument();
    expect(
      screen.queryByText(CHAT_OFFLINE_STATES_CONTENT.offlineNotice.heading),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: c.ctaLabel })).toHaveAttribute("href", "/");
  });

  it("shows the rate-limit message with the wait time when Retry-After was supplied (FR-28)", () => {
    useThreadRegistryStore.setState({ activeThreadId: THREAD });
    useChatConnectivityStore.getState().setRateLimited(THREAD, 30);

    renderBanner();

    expect(
      screen.getByText(CHAT_OFFLINE_STATES_CONTENT.rateLimited.withWait(30)),
    ).toBeInTheDocument();
  });

  it("shows the rate-limit message with no number when Retry-After was absent", () => {
    useThreadRegistryStore.setState({ activeThreadId: THREAD });
    useChatConnectivityStore.getState().setRateLimited(THREAD, undefined);

    renderBanner();

    expect(
      screen.getByText(CHAT_OFFLINE_STATES_CONTENT.rateLimited.withoutWait),
    ).toBeInTheDocument();
  });

  it("shows the too-long notice with no retry and no link", () => {
    useThreadRegistryStore.setState({ activeThreadId: THREAD });
    useChatConnectivityStore.getState().setTooLong(THREAD);

    renderBanner();

    const c = COMPOSER_LIMIT_CONTENT.tooLongNotice;
    expect(screen.getByText(c.heading)).toBeInTheDocument();
    expect(screen.getByText(c.body)).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
    expect(document.body.textContent).not.toMatch(/try again/i);
  });

  it("renders nothing when there is no active thread", () => {
    useThreadRegistryStore.setState({ activeThreadId: null });

    const { container } = renderBanner();

    expect(container).toBeEmptyDOMElement();
  });
});
