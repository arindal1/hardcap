const GEMINI_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export interface InsightPayload {
  month: string;
  monthlyIncome: number;
  overallRemaining: number;
  daysRemainingInMonth: number;
  groups: { name: string; cap: number; spent: number; remaining: number }[];
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const response = await fetch(GEMINI_URL(model), {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const json = await response.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini response did not contain text");
  return text;
}

export async function requestGeminiInsight(payload: InsightPayload): Promise<string> {
  const prompt = `You are a personal finance assistant. Given this user's current month budget data, give concise, actionable advice on how to pace their spending for the rest of the month. Be specific about which budget groups are at risk. Then add a markdown section titled "## Reallocation suggestions" with 2-3 concrete, numbered suggestions for moving specific rupee amounts between specific named groups (e.g. reduce X by ₹400, increase Y by ₹400) based on which groups are over/under spending pace - only suggest this if the data supports it. Format the whole response in Markdown. Keep it under 250 words.\n\nData: ${JSON.stringify(payload)}`;
  return callGemini(prompt);
}

export interface MonthEndReviewPayload {
  month: string;
  monthlyIncome: number;
  totalCap: number;
  totalSpent: number;
  closedUnderBudget: boolean;
  groups: { name: string; cap: number; spent: number; isOverCap: boolean }[];
}

export async function requestGeminiMonthEndReview(payload: MonthEndReviewPayload): Promise<string> {
  const prompt = `You are a personal finance assistant writing a friendly month-end review for a completed month of budgeting. Given this data, write a short Markdown report with sections: "## Summary" (how the month went overall), "## Highlights" (achievements, e.g. groups that stayed under cap, streaks), and "## Advice for next month" (2-3 concrete suggestions). Be encouraging but honest about overspending. Keep it under 300 words.\n\nData: ${JSON.stringify(payload)}`;
  return callGemini(prompt);
}