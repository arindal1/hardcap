const GEMINI_URL = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export interface InsightPayload {
  month: string;
  monthlyIncome: number;
  overallRemaining: number;
  daysRemainingInMonth: number;
  groups: { name: string; cap: number; spent: number; remaining: number }[];
}

export async function requestGeminiInsight(payload: InsightPayload): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const prompt = `You are a personal finance assistant. Given this user's current month budget data, give concise, actionable advice on how to pace their spending for the rest of the month. Be specific about which budget groups are at risk. Keep it under 200 words.\n\nData: ${JSON.stringify(payload)}`;

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