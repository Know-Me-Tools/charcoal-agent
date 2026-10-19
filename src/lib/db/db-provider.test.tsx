import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CharcoalDb as CharcoalDbType } from "@/lib/db/pglite";
import { DB_RESET_NOTICE_CONTENT } from "../../../content/site/db-reset-notice";

const toastMock = vi.fn();
vi.mock("sonner", () => ({ toast: toastMock }));

const purgeDatabase = vi.fn();
vi.mock("@/lib/db/purge", () => ({ purgeDatabase }));

const replayJournal = vi.fn();
const discardJournalAfterPurge = vi.fn();
vi.mock("@/lib/db/persistence-journal", () => ({ replayJournal, discardJournalAfterPurge }));

const { CharcoalDb } = await import("@/lib/db/pglite");
const { DbProvider } = await import("./db-provider");
const { PersistenceNotices } = await import("@/components/common/persistence-notices");

const fakeDb = {} as CharcoalDbType;
const bundleError = () => new Error("Invalid FS bundle size: 10 !== 20");

function renderApp() {
  return render(
    <DbProvider>
      <PersistenceNotices />
      <p>app is open</p>
    </DbProvider>,
  );
}

function resetNoticeCalls() {
  return toastMock.mock.calls.filter(([text]) => text === DB_RESET_NOTICE_CONTENT.text);
}

beforeEach(() => {
  toastMock.mockClear();
  purgeDatabase.mockReset().mockResolvedValue(undefined);
  replayJournal.mockReset().mockResolvedValue(undefined);
  discardJournalAfterPurge.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DbProvider reset notice", () => {
  it("shows the reset notice once after the database is purged and reopened", async () => {
    const open = vi
      .spyOn(CharcoalDb, "open")
      .mockRejectedValueOnce(bundleError())
      .mockResolvedValueOnce(fakeDb);

    renderApp();
    await act(async () => {});

    expect(await screen.findByText("app is open")).toBeInTheDocument();
    expect(open).toHaveBeenCalledTimes(2);
    expect(purgeDatabase).toHaveBeenCalledTimes(1);
    expect(resetNoticeCalls()).toHaveLength(1);
    // Stays until dismissed, with a close control, under one stable id.
    expect(resetNoticeCalls()[0][1]).toMatchObject({
      id: expect.any(String),
      duration: Infinity,
      closeButton: true,
    });
  });

  it("shows no notice on a normal start", async () => {
    vi.spyOn(CharcoalDb, "open").mockResolvedValue(fakeDb);

    renderApp();
    await act(async () => {});

    expect(await screen.findByText("app is open")).toBeInTheDocument();
    expect(purgeDatabase).not.toHaveBeenCalled();
    expect(resetNoticeCalls()).toHaveLength(0);
  });

  it("shows no notice on a later load after the reset", async () => {
    vi.spyOn(CharcoalDb, "open")
      .mockRejectedValueOnce(bundleError())
      .mockResolvedValue(fakeDb);

    const first = renderApp();
    await act(async () => {});
    await screen.findByText("app is open");
    expect(resetNoticeCalls()).toHaveLength(1);
    first.unmount();
    toastMock.mockClear();

    renderApp();
    await act(async () => {});

    expect(await screen.findByText("app is open")).toBeInTheDocument();
    expect(resetNoticeCalls()).toHaveLength(0);
  });

  it("keeps the database error screen and shows no notice when the reopen also fails", async () => {
    vi.spyOn(CharcoalDb, "open").mockRejectedValue(bundleError());

    renderApp();
    await act(async () => {});

    expect(await screen.findByText("Database error")).toBeInTheDocument();
    expect(screen.queryByText("app is open")).not.toBeInTheDocument();
    expect(resetNoticeCalls()).toHaveLength(0);
  });
});
