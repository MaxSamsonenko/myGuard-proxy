# MyGuard Proxy API

Цей бекенд працює як проксі до OpenAI API для розширення myGuard Privacy Extension.

## Роут

`POST /api/explain`

Body:

```json
{
	"message": "текст загрози",
	"category": "form_threats",
	"url": "https://example.com"
}
```
