import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, TutorialDoc } from "@/lib/db";
import { hasBackend, apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Tutorials() {
  const [items, setItems] = useState<TutorialDoc[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      if (hasBackend()) {
        const rows = await apiGet<TutorialDoc[]>(`/api/tutorials`);
        setItems(rows);
      } else {
        const all = await db.tutorials.orderBy("updatedAt").reverse().toArray();
        setItems(all);
      }
    })();
  }, []);
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tutorial Library</h1>
        <Button onClick={() => navigate("/tutorial/record")}>New Tutorial</Button>
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground">No tutorials yet. Create one to get started.</div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="flex items-center justify-between border rounded-lg p-4">
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.stepCount} steps • {new Date(t.updatedAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(`/tutorial/${t.id}`)}>View</Button>
                <Button onClick={() => navigate(`/tutorial/${t.id}`)}>Preview</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

