import { useCallback, useEffect, useRef, useState } from "react";
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
import { api } from "@/lib/api-client";
import type { CachingScope, UpdateUserSettingsPayload, UserSettings } from "@/types";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function UserSettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isJwt = isJwtConfigured();

  const fetchSettings = useCallback(async () => {
    if (!isJwt) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<UserSettings>("/api/uar/user/settings");
      setSettings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load user settings");
    } finally {
      setLoading(false);
    }
  }, [isJwt]);

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  const save = async () => {
    if (!settings || !isJwt) return;
    setSaving(true);
    setError(null);
    try {
      const payload: UpdateUserSettingsPayload = {
        prompt_caching_enabled: settings.prompt_caching_enabled,
        preferred_scope: settings.preferred_scope,
      };
      const updated = await api.put<UserSettings>("/api/uar/user/settings", payload);
      setSettings(updated);
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save user settings");
    } finally {
      setSaving(false);
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

        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/30 px-6 py-10 text-center">
          <User size={36} className="text-muted-foreground/40" />
          <div className="space-y-1">
            <p className="font-display text-base font-semibold text-foreground">
              JWT required
            </p>
            <p className="font-body text-sm text-muted-foreground">
              Per-user settings are only available when{" "}
              <code className="rounded bg-muted px-1 font-mono text-[12px]">
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
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
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
            className="h-8 gap-1.5 font-mono text-[11px]"
            onClick={() => { void fetchSettings(); }}
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
            className="h-8 gap-1.5 font-mono text-[11px]"
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
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2">
          <AlertCircle size={13} className="shrink-0 text-destructive" />
          <span className="font-mono text-[11px] text-destructive">{error}</span>
        </div>
      )}

      {/* Prompt Caching */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
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
                  className="font-mono text-[10px] text-muted-foreground underline"
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
            onValueChange={(v) =>
              setSettings((s) =>
                s ? { ...s, preferred_scope: v as CachingScope } : s,
              )
            }
            disabled={!settings}
          >
            <SelectTrigger className="font-mono text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="session" className="font-mono text-[12px]">
                Session (per-conversation)
              </SelectItem>
              <SelectItem value="user" className="font-mono text-[12px]">
                User (account-wide)
              </SelectItem>
              <SelectItem value="agent" className="font-mono text-[12px]">
                Agent (per-agent default)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Settings hierarchy explanation */}
      <section className="rounded-xl border border-border bg-muted/30 p-5">
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
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-bold text-primary">
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
        <p className="font-mono text-[10px] text-muted-foreground">
          Last updated:{" "}
          {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
}
