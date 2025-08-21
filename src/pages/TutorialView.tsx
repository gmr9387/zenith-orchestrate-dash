import { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { db, TutorialStep, TutorialDoc, TutorialMedia } from "@/lib/db";
import { hasBackend, apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";

function formatTime(seconds: number) {
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
  const h = Math.floor(seconds / 3600);
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

export default function TutorialView() {
  const { id } = useParams();
  const [doc, setDoc] = useState<TutorialDoc | null>(null);
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      if (hasBackend()) {
        try {
          const t = await apiGet<{ id: string; title: string; createdAt: number; updatedAt: number; stepCount: number; steps: TutorialStep[] }>(`/api/tutorials/${id}`);
          setDoc({ id: t.id, title: t.title, createdAt: t.createdAt, updatedAt: t.updatedAt, stepCount: t.stepCount });
          setSteps(t.steps);
          // try media endpoint
          const url = (import.meta.env.VITE_API_URL as string) + `/api/tutorials/${id}/media`;
          const head = await fetch(url, { method: 'HEAD' });
          if (head.ok) setMediaUrl(url);
        } catch {
          // fall back to local
        }
      }
      if (!hasBackend()) {
        const d = await db.tutorials.get(id);
        setDoc(d ?? null);
        const s = await db.steps.where("tutorialId").equals(id).sortBy("ts");
        setSteps(s);
        const m: TutorialMedia | undefined = await db.media.get(id);
        if (m) setMediaUrl(URL.createObjectURL(m.blob));
      }
    })();
  }, [id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime || 0);
    const onLoaded = () => setDuration(v.duration || 0);
    v.addEventListener('timeupdate', onTime);
    v.addEventListener('loadedmetadata', onLoaded);
    return () => {
      v.removeEventListener('timeupdate', onTime);
      v.removeEventListener('loadedmetadata', onLoaded);
    };
  }, [mediaUrl]);

  const current = steps[idx];
  const progress = useMemo(() => (steps.length ? Math.round(((idx + 1) / steps.length) * 100) : 0), [idx, steps.length]);

  function next() { setIdx((i) => Math.min(i + 1, steps.length - 1)); }
  function prev() { setIdx((i) => Math.max(i - 1, 0)); }

  const seek = (delta: number) => {
    const v = videoRef.current; if (!v) return;
    v.currentTime = Math.max(0, Math.min((v.currentTime || 0) + delta, v.duration || 0));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{doc?.title ?? "Tutorial"}</h1>
        <div className="text-sm text-muted-foreground">{steps.length} steps</div>
      </div>
      {mediaUrl && (
        <div className="mb-4 rounded-lg overflow-hidden border">
          <video ref={videoRef} src={mediaUrl} controls className="w-full h-auto" />
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => seek(-5)}>−5s</Button>
              <Button size="sm" variant="ghost" onClick={() => seek(+5)}>+5s</Button>
            </div>
            <div>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
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

