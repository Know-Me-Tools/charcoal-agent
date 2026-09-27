import { useRef, useState } from "react";
import { AlertCircle, Check, Loader2, RefreshCw, Save, User } from "lucide-react";
import { SectionLabel } from "@/components/common/section-label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isJwtConfigured } from "@/lib/api-client";
import { useSaveUserSettings, useUserSettings } from "@/hooks/use-user-settings";
import type { CachingScope, UpdateUserSettingsPayload, UserSettings } from "@/types";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

const SCOPE_ITEMS = [
  { value: "session", label: "Session (per-conversation)" },
  { value: "user", label: "User (account-wide)" },
  { value: "agent", label: "Agent (per-agent default)" },
];

export default function UserSettingsPage() {
  const isJwt = isJwtConfigured();
  const settingsQuery = useUserSettings(isJwt);
  const saveSettings = useSaveUserSettings();
  // Unsaved edits; cleared after a successful save so the graph copy shows again.
  const [draft, setDraft] = useState<UserSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const settings = draft ?? settingsQuery.data ?? null;
  const setSettings = (update: (s: UserSettings | null) => UserSettings | null) =>
    setDraft((prev) => update(prev ?? settingsQuery.data ?? null));
  const loading = settingsQuery.isLoading;
  const saving = saveSettings.isPending;
  const error = saveSettings.error?.message ?? settingsQuery.error?.message ?? null;
  const fetchSettings = () => {
    setDraft(null);
    settingsQuery.refetch();
  };

  const save = async () => {
    if (!settings || !isJwt) return;
    const payload: UpdateUserSettingsPayload = {
      prompt_caching_enabled: settings.prompt_caching_enabled,
      preferred_scope: settings.preferred_scope,
    };
    try {
      await saveSettings.mutateAsync(payload);
      setDraft(null);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error is surfaced through `saveSettings.error`.
    }
  };

  if (!isJwt) {
    return (
      <div className="max-w-lg space-y-6">
        <div>
          <SectionLabel>User Settings</SectionLabel>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
            Per-user Settings
          </h1>
          <p className="mt-1 font-body text-sm text-muted-foreground">
            Manage your personal preferences for prompt caching and other
            session-level behaviours.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl bg-band px-6 py-10 text-center">
          <User size={36} className="text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="font-display text-base font-semibold text-foreground">
              JWT required
            </p>
            <p className="font-body text-sm text-muted-foreground">
              Per-user settings are only available when{" "}
              {/* This code chip sits on the `bg-band` fill above, so it uses
                  `bg-surface` rather than `bg-muted-surface`, which resolves to
                  the same colour as `bg-band` in light. */}
              <code className="rounded bg-raised px-1 font-mono text-xs">
                VITE_UAR_API_KEY
              </code>{" "}
              is a JWT Bearer token.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <SectionLabel>User Settings</SectionLabel>
          <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
            Per-user Settings
          </h1>
          {settings && (
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              Signed in as{" "}
              <span className="font-medium text-foreground">
                {settings.user_id}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 font-mono text-xs"
            onClick={fetchSettings}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RefreshCw size={12} />
            )}
            Reload
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1.5 font-mono text-xs"
            onClick={() => { void save(); }}
            disabled={saving || loading || !settings}
          >
            {saved ? (
              <>
                <Check size={12} /> Saved
              </>
            ) : saving ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={12} /> Save changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-danger-soft px-4 py-2">
          <AlertCircle size={13} className="shrink-0 text-danger-text" />
          <span className="font-mono text-xs text-danger-text">{error}</span>
        </div>
      )}

      {/* Prompt Caching */}
      <section className="space-y-4 rounded-xl bg-band p-5">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Prompt Caching
          </h2>
          <p className="font-body text-sm text-muted-foreground">
            Controls whether your requests use prompt caching at the account level.
            Session-level overrides (set from the chat toolbar) take precedence
            over this setting.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label
              htmlFor="caching-switch"
              className="font-display text-sm font-medium text-foreground"
            >
              Enable prompt caching
            </Label>
            <p className="font-body text-xs text-muted-foreground">
              {settings?.prompt_caching_enabled === null || settings?.prompt_caching_enabled === undefined
                ? "Inheriting global default"
                : settings.prompt_caching_enabled
                  ? "Enabled for your account"
                  : "Disabled for your account"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {settings?.prompt_caching_enabled !== null &&
              settings?.prompt_caching_enabled !== undefined && (
                <button
                  type="button"
                  className="rounded-md font-mono text-xs text-muted-foreground underline focus-cue"
                  onClick={() =>
                    setSettings((s) =>
                      s ? { ...s, prompt_caching_enabled: null } : s,
                    )
                  }
                >
                  reset to default
                </button>
              )}
            <Switch
              id="caching-switch"
              checked={settings?.prompt_caching_enabled ?? false}
              onCheckedChange={(v) =>
                setSettings((s) => (s ? { ...s, prompt_caching_enabled: v } : s))
              }
              disabled={!settings}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="font-display text-sm font-medium text-foreground">
            Preferred scope
          </Label>
          <p className="font-body text-xs text-muted-foreground">
            Which level of settings takes precedence when no session override is
            active.
          </p>
          <Select
            value={settings?.preferred_scope ?? "session"}
            items={SCOPE_ITEMS}
            onValueChange={(v) => {
              if (v === null) return;
              setSettings((s) => (s ? { ...s, preferred_scope: v as CachingScope } : s));
            }}
            disabled={!settings}
          >
            <SelectTrigger className="font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="session" className="font-mono text-xs">
                Session (per-conversation)
              </SelectItem>
              <SelectItem value="user" className="font-mono text-xs">
                User (account-wide)
              </SelectItem>
              <SelectItem value="agent" className="font-mono text-xs">
                Agent (per-agent default)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Settings hierarchy explanation */}
      <section className="rounded-xl bg-band p-5">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Settings priority
        </h3>
        <ol className="mt-2 space-y-1">
          {[
            "Session override (chat toolbar toggle)",
            "User preference (this page)",
            "Agent setting (per-agent configuration)",
            "Global default (UAR admin settings)",
          ].map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-ember-text">
                {i + 1}
              </span>
              <span className="font-body text-xs text-muted-foreground">
                {label}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 font-body text-xs text-muted-foreground">
          Higher-priority settings override lower-priority ones. Leave a setting
          unset to inherit from the next level.
        </p>
      </section>

      {settings?.updated_at && (
        <p className="font-mono text-xs text-muted-foreground">
          Last updated:{" "}
          {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
