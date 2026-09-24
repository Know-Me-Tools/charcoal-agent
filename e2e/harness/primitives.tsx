/* eslint-disable react-refresh/only-export-components -- standalone harness entry, never hot-reloaded as a module */
/**
 * Browser-only harness for primitive behaviors that need real layout
 * (focus trapping, select positioning). Served by the Vite dev server for
 * Playwright; not part of the production build (only index.html is built).
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@/index.css";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

function Harness() {
  const [provider, setProvider] = useState<string | null>(null);
  return (
    <main className="space-y-6 p-8">
      <Dialog>
        <DialogTrigger render={<Button />}>Open settings</DialogTrigger>
        <DialogContent>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Adjust options</DialogDescription>
          <input aria-label="Name" className="border p-1" />
          <button type="button">Save</button>
        </DialogContent>
      </Dialog>

      <Select value={provider} items={PROVIDERS} onValueChange={setProvider}>
        <SelectTrigger aria-label="Provider" className="w-60">
          <SelectValue placeholder="Select provider" />
        </SelectTrigger>
        <SelectContent>
          {PROVIDERS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <output data-testid="provider-value">{provider ?? ""}</output>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Harness />);
