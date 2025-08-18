import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db, TutorialStep, TutorialDoc } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

export default function TutorialRecord() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const tutorialIdRef = useRef<string>(crypto.randomUUID());
  const [title, setTitle] = useState<string>(() => params.get("title") || "Untitled Tutorial");

  useEffect(() => {
    if (!recording) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element;
      const selector = buildSelector(target);
      persistStep({ kind: "click", selector });
    };
    const handleKey = (e: KeyboardEvent) => {
      persistStep({ kind: "keydown", key: e.key });
    };
    const mo = new MutationObserver((mut) => {
      if (mut.length) persistStep({ kind: "mutation" });
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: false });
    window.addEventListener("click", handleClick, true);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("keydown", handleKey, true);
      mo.disconnect();
    };
  }, [recording]);

  async function persistStep(partial: Omit<TutorialStep, "tutorialId" | "ts">) {
    const step: TutorialStep = {
      tutorialId: tutorialIdRef.current,
      ts: Date.now(),
      ...partial,
    };
    await db.steps.add(step);
  }

  async function start() {
    setRecording(true);
    const doc: TutorialDoc = {
      id: tutorialIdRef.current,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stepCount: 0,
    };
    await db.tutorials.put(doc);
    toast("Recording started", { description: title });
  }

  async function stop() {
    setRecording(false);
    const count = await db.steps.where("tutorialId").equals(tutorialIdRef.current).count();
    await db.tutorials.update(tutorialIdRef.current, { updatedAt: Date.now(), stepCount: count });
    toast("Recording saved", { description: `${count} steps` });
    navigate(`/tutorial/${tutorialIdRef.current}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Tutorial Recorder</h1>
      <p className="text-muted-foreground mb-6">Capture clicks and keys to build a step-by-step tutorial.</p>
      <div className="flex items-center gap-3 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tutorial title"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {!recording ? (
          <Button onClick={start}>Start Recording</Button>
        ) : (
          <Button variant="destructive" onClick={stop}>Stop & Save</Button>
        )}
      </div>
      <div className={`rounded-lg border border-dashed p-6 ${recording ? "bg-primary/5" : "bg-muted/20"}`}>
        <div className="text-sm text-muted-foreground">
          {recording ? "Recording interactions… Click around to add steps." : "Press Start to begin recording."}
        </div>
      </div>
    </div>
  );
}

function buildSelector(el: Element): string {
  const id = el.getAttribute("id");
  if (id) return `#${id}`;
  const classes = el.getAttribute("class");
  if (classes) return `${el.tagName.toLowerCase()}.${classes.split(/\s+/).slice(0, 3).join('.')}`;
  return el.tagName.toLowerCase();
}

