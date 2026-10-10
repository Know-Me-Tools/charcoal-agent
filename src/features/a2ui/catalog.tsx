import { useId, useState, type ReactNode } from "react";
import {
  createPrometheusA2uiCatalog,
  createPrometheusA2uiComponent,
  getPrometheusA2uiOfficialComponent,
  type PrometheusA2uiComponentImplementation,
  type PrometheusA2uiComponentName,
} from "@prometheus-ags/a2ui-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { A2UI_BASIC_CATALOG_ID, UAR_A2UI_CATALOG_ID } from "./carrier-adapter";

/**
 * The nine components UAR's validator allows (`src/uar/a2ui/protocol.rs`),
 * implemented with the KnowMe shadcn primitives under the Flat 2.0 tokens: no
 * borders, shadows or gradients. Text is plain text, never Markdown, so a model
 * cannot inject links or HTML through a surface.
 *
 * The schemas come from the official components (`api` argument), so the
 * property names and bindings are exactly the pinned A2UI 0.12.0 ones.
 */

type Children = readonly (string | { id: string; basePath?: string })[] | undefined;

interface RenderProps<P> {
  props: P;
  buildChild: (id: string, basePath?: string) => ReactNode;
}

const JUSTIFY: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  spaceBetween: "space-between",
  spaceAround: "space-around",
  spaceEvenly: "space-evenly",
  stretch: "stretch",
};
const ALIGN: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
};

function renderChildren(
  children: Children,
  buildChild: (id: string, basePath?: string) => ReactNode,
): ReactNode {
  if (!Array.isArray(children)) return null;
  return children.map((ref, index) =>
    typeof ref === "string" ? (
      <span key={`${ref}-${index}`} className="contents">
        {buildChild(ref)}
      </span>
    ) : (
      <span key={`${ref.id}-${ref.basePath ?? ""}-${index}`} className="contents">
        {buildChild(ref.id, ref.basePath)}
      </span>
    ),
  );
}

const HEADING_CLASS: Record<string, string> = {
  h1: "text-2xl font-semibold leading-tight",
  h2: "text-xl font-semibold leading-tight",
  h3: "text-lg font-semibold leading-snug",
  h4: "text-base font-semibold leading-snug",
  h5: "text-sm font-semibold leading-snug",
};

const Text = createPrometheusA2uiComponent(
  getPrometheusA2uiOfficialComponent("Text"),
  ({ props }: RenderProps<{ text?: unknown; variant?: string }>) => {
    const text = typeof props.text === "string" ? props.text : String(props.text ?? "");
    const variant = props.variant ?? "body";
    if (variant in HEADING_CLASS) {
      const Tag = variant as "h1" | "h2" | "h3" | "h4" | "h5";
      return <Tag className={cn("text-fg", HEADING_CLASS[variant])}>{text}</Tag>;
    }
    if (variant === "caption") {
      return <p className="text-xs text-faint">{text}</p>;
    }
    return <p className="text-sm leading-relaxed text-fg">{text}</p>;
  },
);

const Row = createPrometheusA2uiComponent(
  getPrometheusA2uiOfficialComponent("Row"),
  ({ props, buildChild }: RenderProps<{ children?: Children; justify?: string; align?: string }>) => (
    <div
      className="flex flex-row flex-wrap gap-3"
      style={{
        justifyContent: JUSTIFY[props.justify ?? "start"],
        alignItems: ALIGN[props.align ?? "center"],
      }}
    >
      {renderChildren(props.children, buildChild)}
    </div>
  ),
);

const Column = createPrometheusA2uiComponent(
  getPrometheusA2uiOfficialComponent("Column"),
  ({ props, buildChild }: RenderProps<{ children?: Children; justify?: string; align?: string }>) => (
    <div
      className="flex flex-col gap-3"
      style={{
        justifyContent: JUSTIFY[props.justify ?? "start"],
        alignItems: ALIGN[props.align ?? "stretch"],
      }}
    >
      {renderChildren(props.children, buildChild)}
    </div>
  ),
);

const Card = createPrometheusA2uiComponent(
  getPrometheusA2uiOfficialComponent("Card"),
  ({ props, buildChild }: RenderProps<{ child?: string }>) => (
    <div className="rounded-xl bg-muted-surface p-4 text-fg">
      {props.child ? buildChild(props.child) : null}
    </div>
  ),
);

const Divider = createPrometheusA2uiComponent(
  getPrometheusA2uiOfficialComponent("Divider"),
  ({ props }: RenderProps<{ axis?: string }>) => (
    <Separator orientation={props.axis === "vertical" ? "vertical" : "horizontal"} />
  ),
);

/**
 * Surfaces are render-only in this change (spec: "Surfaces are render-only").
 * A Button is always disabled and never wires `props.action`, so activating it
 * cannot reach the runtime's action policy at all.
 */
const Button_ = createPrometheusA2uiComponent(
  getPrometheusA2uiOfficialComponent("Button"),
  ({ props, buildChild }: RenderProps<{ child?: string; variant?: string }>) => (
    <Button
      type="button"
      disabled
      variant={props.variant === "primary" ? "default" : props.variant === "borderless" ? "ghost" : "secondary"}
      title="Actions are not available in this view"
    >
      {props.child ? buildChild(props.child) : null}
    </Button>
  ),
);

const FIELD_CLASSES =
  "border-0 bg-muted-surface text-fg placeholder:text-faint focus-visible:ring-0 focus-cue";

interface FieldProps {
  label?: string;
  value?: unknown;
  variant?: string;
  validationErrors?: readonly string[];
  /** Absent when the value is a literal rather than a data binding. */
  setValue?: (value: unknown) => void;
}

const TextField = createPrometheusA2uiComponent(getPrometheusA2uiOfficialComponent("TextField"), ({ props }: RenderProps<FieldProps>) => {
  const id = useId();
  const error = props.validationErrors?.[0];
  const common = {
    id,
    value: typeof props.value === "string" ? props.value : String(props.value ?? ""),
    onChange: (e: { target: { value: string } }) => props.setValue?.(e.target.value),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
    className: FIELD_CLASSES,
  };
  return (
    <div className="flex flex-col gap-1.5">
      {props.label ? <Label htmlFor={id}>{props.label}</Label> : null}
      {props.variant === "longText" ? (
        <Textarea {...common} />
      ) : (
        <Input
          {...common}
          type={props.variant === "number" ? "number" : props.variant === "obscured" ? "password" : "text"}
        />
      )}
      {error ? (
        <span id={`${id}-error`} role="alert" className="text-xs text-danger-text">
          {error}
        </span>
      ) : null}
    </div>
  );
});

const CheckBox = createPrometheusA2uiComponent(getPrometheusA2uiOfficialComponent("CheckBox"), ({ props }: RenderProps<FieldProps>) => {
  const id = useId();
  const error = props.validationErrors?.[0];
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          className="size-4 accent-primary focus-cue"
          checked={Boolean(props.value)}
          onChange={(e) => props.setValue?.(e.target.checked)}
          aria-invalid={error ? true : undefined}
        />
        {props.label ? <Label htmlFor={id}>{props.label}</Label> : null}
      </div>
      {error ? (
        <span role="alert" className="text-xs text-danger-text">
          {error}
        </span>
      ) : null}
    </div>
  );
});

interface ChoiceProps {
  label?: string;
  value?: unknown;
  variant?: string;
  displayStyle?: string;
  filterable?: boolean;
  options?: readonly { label: unknown; value: string }[];
  /** Absent when the value is a literal rather than a data binding. */
  setValue?: (value: unknown) => void;
}

const ChoicePicker = createPrometheusA2uiComponent(getPrometheusA2uiOfficialComponent("ChoicePicker"), ({ props }: RenderProps<ChoiceProps>) => {
  const group = useId();
  const [filter, setFilter] = useState("");
  const selected: readonly string[] = Array.isArray(props.value) ? (props.value as string[]) : [];
  const exclusive = props.variant === "mutuallyExclusive";
  const toggle = (value: string) => {
    if (exclusive) props.setValue?.([value]);
    else props.setValue?.(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };
  const options = (props.options ?? []).filter(
    (option) => !props.filterable || filter === "" || String(option.label).toLowerCase().includes(filter.toLowerCase()),
  );
  const chips = props.displayStyle === "chips";
  return (
    <div role="group" aria-labelledby={props.label ? `${group}-label` : undefined} className="flex flex-col gap-2">
      {props.label ? (
        <span id={`${group}-label`} className="text-sm font-medium text-fg">
          {props.label}
        </span>
      ) : null}
      {props.filterable ? (
        <Input
          type="text"
          aria-label="Filter options"
          placeholder="Filter options"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={FIELD_CLASSES}
        />
      ) : null}
      <div className={cn("flex gap-2", chips ? "flex-row flex-wrap" : "flex-col")}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const label = String(option.label);
          return chips ? (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "secondary"}
              aria-pressed={isSelected}
              onClick={() => toggle(option.value)}
            >
              {label}
            </Button>
          ) : (
            <label key={option.value} className="flex items-center gap-2 text-sm text-fg">
              <input
                type={exclusive ? "radio" : "checkbox"}
                name={exclusive ? group : undefined}
                className="size-4 accent-primary focus-cue"
                checked={isSelected}
                onChange={() => toggle(option.value)}
              />
              {label}
            </label>
          );
        })}
      </div>
    </div>
  );
});

const COMPONENT_NAMES: readonly PrometheusA2uiComponentName[] = [
  "Text",
  "Button",
  "TextField",
  "CheckBox",
  "ChoicePicker",
  "Row",
  "Column",
  "Card",
  "Divider",
];

const IMPLEMENTATIONS: readonly PrometheusA2uiComponentImplementation[] = [
  Text,
  Button_,
  TextField,
  CheckBox,
  ChoicePicker,
  Row,
  Column,
  Card,
  Divider,
];

/**
 * One catalog per id UAR may name in `createSurface`. They share the same
 * components, so either id renders identically. Functions stay on PEM's default
 * pure-function allowlist; `openUrl` is not enabled.
 */
export function createKnowmeA2uiCatalogs() {
  return [UAR_A2UI_CATALOG_ID, A2UI_BASIC_CATALOG_ID].map((id) =>
    createPrometheusA2uiCatalog({
      id,
      components: COMPONENT_NAMES,
      implementations: IMPLEMENTATIONS,
    }),
  );
}
