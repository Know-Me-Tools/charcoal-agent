import { afterEach, describe, expect, it } from "vitest";
import { selectChatConnectivity, useChatConnectivityStore } from "./chat-connectivity-store";

const THREAD = "thread-connectivity-test";

afterEach(() => {
  useChatConnectivityStore.getState().clear(THREAD);
});

describe("chat-connectivity-store", () => {
  it("defaults an unknown thread to online", () => {
    expect(selectChatConnectivity(THREAD)(useChatConnectivityStore.getState())).toEqual({
      kind: "online",
    });
  });

  it("setOffline then clear returns the thread to online", () => {
    useChatConnectivityStore.getState().setOffline(THREAD);
    expect(selectChatConnectivity(THREAD)(useChatConnectivityStore.getState())).toEqual({
      kind: "offline",
    });

    useChatConnectivityStore.getState().clear(THREAD);
    expect(selectChatConnectivity(THREAD)(useChatConnectivityStore.getState())).toEqual({
      kind: "online",
    });
  });

  it("setRateLimited stores the retryAfterSeconds it was given, including undefined", () => {
    useChatConnectivityStore.getState().setRateLimited(THREAD, 12);
    expect(selectChatConnectivity(THREAD)(useChatConnectivityStore.getState())).toEqual({
      kind: "rate-limited",
      retryAfterSeconds: 12,
    });

    useChatConnectivityStore.getState().setRateLimited(THREAD, undefined);
    expect(selectChatConnectivity(THREAD)(useChatConnectivityStore.getState())).toEqual({
      kind: "rate-limited",
      retryAfterSeconds: undefined,
    });
  });

  it("does not affect other threads", () => {
    useChatConnectivityStore.getState().setOffline(THREAD);
    expect(
      selectChatConnectivity("some-other-thread")(useChatConnectivityStore.getState()),
    ).toEqual({ kind: "online" });
  });
});
