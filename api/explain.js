import fetch from "node-fetch";

export default async function handler(req, res) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	try {
		const { message, category, url } = req.body;

		if (!message) {
			return res.status(400).json({ error: "Message is required" });
		}

		const prompt = `Поясни цю загрозу простою мовою. Категорія: ${category}, URL: ${url}, Повідомлення: ${message}`;

		const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4o-mini",
				messages: [{ role: "user", content: prompt }],
				temperature: 0.3,
			}),
		});

		const data = await aiResp.json();
		const explanation = data.choices?.[0]?.message?.content ?? "";

		res.status(200).json({ explanation });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Server error" });
	}
}
