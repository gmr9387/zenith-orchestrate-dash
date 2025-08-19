import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { db, TutorialStep, TutorialDoc, TutorialMedia } from "@/lib/db";
import { Button } from "@/components/ui/button";

export default function TutorialView() {
  const { id } = useParams();
  const [doc, setDoc] = useState<TutorialDoc | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const d = await db.tutorials.get(id);
      setDoc(d ?? null);
      const s = await db.steps.where("tutorialId").equals(id).sortBy("ts");
      setSteps(s);
      const m: TutorialMedia | undefined = await db.media.get(id);
      if (m) setMediaUrl(URL.createObjectURL(m.blob));
    })();
  }, [id]);

  const current = steps[idx];
  const progress = useMemo(() => (steps.length ? Math.round(((idx + 1) / steps.length) * 100) : 0), [idx, steps.length]);

  function next() { setIdx((i) => Math.min(i + 1, steps.length - 1)); }
  function prev() { setIdx((i) => Math.max(i - 1, 0)); }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{doc?.title ?? "Tutorial"}</h1>
        <div className="text-sm text-muted-foreground">{steps.length} steps</div>
      </div>
      {mediaUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border">
          <video src={mediaUrl} controls className="w-full h-auto" />
        </div>
      )}
      <div className="mb-4 h-2 bg-muted rounded">
        <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
      </div>
      <div className="rounded-lg border p-6 min-h-[160px]">
        {current ? (
          <div>
            <div className="text-sm text-muted-foreground mb-2">{new Date(current.ts).toLocaleTimeString()}</div>
            <div className="text-lg font-medium mb-1 capitalize">{current.kind}</div>
            {current.selector && (
              <div className="text-sm">Target: <code>{current.selector}</code></div>
            )}
            {current.key && (
              <div className="text-sm">Key: <code>{current.key}</code></div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No steps recorded yet.</div>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <Button variant="outline" onClick={prev} disabled={idx === 0}>Previous</Button>
        <Button onClick={next} disabled={idx >= steps.length - 1}>Next</Button>
      </div>
    </div>
  );
}

