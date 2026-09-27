import { useUi } from "@/hooks/use-ui";
import { SectionLabel } from "@/components/common/section-label";

const fontSizes = [
  { value: "compact" as const, label: "Compact" },
  { value: "default" as const, label: "Default" },
  { value: "comfortable" as const, label: "Comfortable" },
];

export default function AppearancePage() {
  const { theme, setTheme, fontSize, setFontSize } = useUi();

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <SectionLabel>Appearance</SectionLabel>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
          Appearance
        </h1>
      </div>

      <div>
        <label className="ui-label mb-3 block text-foreground">Theme</label>
        <div className="flex gap-3">
          {(["dark", "light"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              aria-pressed={theme === t}
              className={`flex-1 rounded-lg p-4 text-center font-ui text-sm font-semibold transition-hover focus-cue ${
                theme === t
                  ? "bg-ember-soft text-ember-text"
                  : "bg-muted-surface text-muted-foreground hover:bg-hover"
              }`}
            >
              {t === "dark" ? "Dark" : "Light"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="ui-label mb-3 block text-foreground">Font Size</label>
        <div className="flex gap-3">
          {fontSizes.map((fs) => (
            <button
              key={fs.value}
              onClick={() => setFontSize(fs.value)}
              aria-pressed={fontSize === fs.value}
              className={`flex-1 rounded-lg p-4 text-center font-ui text-sm font-semibold transition-hover focus-cue ${
                fontSize === fs.value
                  ? "bg-ember-soft text-ember-text"
                  : "bg-muted-surface text-muted-foreground hover:bg-hover"
              }`}
            >
              {fs.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
