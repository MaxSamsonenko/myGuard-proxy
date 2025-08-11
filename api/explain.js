// api/explain.js — без сторонніх залежностей
const UA_LEVEL = { high: "Високий", medium: "Середній", low: "Низький" };

function setCors(res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
	if (req.method === "OPTIONS") {
		setCors(res);
		res.status(204).end();
		return;
	}
	if (req.method !== "POST") {
		setCors(res);
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	try {
		const { message, category, level = "medium", url } = req.body || {};
		if (!message || !category) {
			setCors(res);
			res.status(400).json({ error: "Missing fields: message, category" });
			return;
		}

		const uiLevel = UA_LEVEL[level] || "Середній";
		const system =
			"Ти — лаконічний асистент з кібербезпеки для браузерного розширення. " +
			"Пояснюй коротко (120–160 слів), простою мовою.";
		const user =
			`Сформулюй пояснення щодо загрози.\nКатегорія: ${category}\n` +
			(url ? `Сторінка: ${url}\n` : "") +
			`Опис: "${message}"\n\n` +
			`Обов'язково додай рядок: "Чому рівень \"${uiLevel}\": …". ` +
			`Наприкінці 2–3 дуже короткі поради.`;

		const r = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				temperature: 0.4,
				max_tokens: 220,
				messages: [
					{ role: "system", content: system },
					{ role: "user", content: user },
				],
			}),
		});

		const data = await r.json();
		if (!r.ok) {
			console.error("OpenAI error:", data);
			setCors(res);
			res.status(502).json({ error: "OpenAI error", detail: data });
			return;
		}

		const text = (data?.choices?.[0]?.message?.content || "").trim();
		setCors(res);
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
		setCors(res);
		res.status(500).json({ error: "AI proxy error", detail: String(e) });
	}
}
