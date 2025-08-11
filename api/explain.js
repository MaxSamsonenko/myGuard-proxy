import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const UA_LEVEL = {
	high: "Високий",
	medium: "Середній",
	low: "Низький",
};

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	try {
		const { message, category, level = "medium", url } = req.body || {};

		if (!message || !category) {
			res
				.status(400)
				.json({ error: "Missing required fields: message, category" });
			return;
		}

		const uiLevel = UA_LEVEL[level] || "Середній";

		const system =
			"Ти — лаконічний асистент з кібербезпеки для браузерного розширення. " +
			"Пояснюй коротко (до 120–160 слів), простою мовою, без води.";

		const user =
			`Сформулюй пояснення для користувача щодо знайденої загрози.\n` +
			`Категорія: ${category}\n` +
			(url ? `Сторінка: ${url}\n` : "") +
			`Опис загрози: "${message}"\n\n` +
			`Обов'язково додай окремий рядок: "Чому рівень \"${uiLevel}\": …" ` +
			`(поясни саме причину присвоєння цього рівня). ` +
			`Наприкінці додай 2–3 дуже короткі поради, що робити користувачу.`;

		const completion = await client.chat.completions.create({
			model: "gpt-4o-mini",
			temperature: 0.4,
			max_tokens: 220,
			messages: [
				{ role: "system", content: system },
				{ role: "user", content: user },
			],
		});

		const text = (completion?.choices?.[0]?.message?.content || "").trim();
		if (!text) {
			res.status(502).json({ error: "Empty AI response" });
			return;
		}

		res.setHeader(
			"Cache-Control",
			"s-maxage=900, stale-while-revalidate=86400"
		);
		res.json({ text });
	} catch (e) {
		console.error("[/api/explain] error:", e);
		res.status(500).json({ error: "AI proxy error" });
	}
}
