import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { autoGenerateTutorial, AutomationAction } from "@/lib/automation";
import { hasBackend, apiPost } from "@/lib/api";

export default function TutorialAuto() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Automated Tutorial");
  const [json, setJson] = useState<AutomationAction[]>([
    { type: "note", title: "Welcome to your automated tutorial" },
    { type: "click", selector: "button", title: "Click the main button" },
    { type: "keydown", key: "Enter", title: "Press Enter to continue" },
  ]);
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setBusy(true);
      let id: string;
      if (hasBackend()) {
        const resp = await apiPost(`/tutorials/generate`, { title, actions: json });
        id = (resp as any).data?.id;
      } else {
        id = await autoGenerateTutorial(title, json);
      }
      toast("Tutorial generated", { description: title });
      navigate(`/tutorial/${id}`);
    } catch (e: any) {
      toast("Failed to generate", { description: e?.message ?? String(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Automated Tutorial Generator</h1>
      <p className="text-muted-foreground mb-6">Provide a title and a JSON list of actions. We will generate a complete tutorial.</p>
      <div className="space-y-4">
        <input
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tutorial title"
        />
        <textarea
          className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          value={JSON.stringify(json, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setJson(parsed);
            } catch {
              // keep old until valid
            }
          }}
        />
        <div className="flex gap-2">
          <Button onClick={submit} disabled={busy}>Generate</Button>
          <Button variant="outline" onClick={() => navigate("/tutorials")}>Back to Library</Button>
        </div>
      </div>
    </div>
  );
}

