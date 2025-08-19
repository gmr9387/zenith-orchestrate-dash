import { db, TutorialDoc, TutorialStep } from "@/lib/db";

export type AutomationAction =
  | { type: "click"; selector: string; title?: string }
  | { type: "keydown"; key: string; title?: string }
  | { type: "note"; title: string };

export interface AutoGenerateOptions {
  alsoSimulateDom?: boolean;
}

export async function autoGenerateTutorial(
  title: string,
  actions: AutomationAction[],
  options: AutoGenerateOptions = {}
): Promise<string> {
  const tutorialId = crypto.randomUUID();
  const now = Date.now();
  const doc: TutorialDoc = {
    id: tutorialId,
    title,
    createdAt: now,
    updatedAt: now,
    stepCount: 0,
  };
  await db.tutorials.put(doc);

  let ts = now;
  for (const action of actions) {
    const step: TutorialStep = {
      tutorialId,
      ts: ts += 50,
      kind: action.type === "note" ? "note" : (action.type as any),
      title: action.title,
      selector: (action as any).selector,
      key: (action as any).key,
    };
    await db.steps.add(step);

    if (options.alsoSimulateDom) {
      simulate(action);
      await sleep(80);
    }
  }
  const count = await db.steps.where("tutorialId").equals(tutorialId).count();
  await db.tutorials.update(tutorialId, { stepCount: count, updatedAt: Date.now() });
  return tutorialId;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function simulate(action: AutomationAction) {
  if (action.type === "click") {
    const el = document.querySelector(action.selector);
    if (el) {
      (el as HTMLElement).focus();
      (el as HTMLElement).click();
    }
  } else if (action.type === "keydown") {
    const ev = new KeyboardEvent("keydown", { key: action.key, bubbles: true });
    document.activeElement?.dispatchEvent(ev);
  }
}

