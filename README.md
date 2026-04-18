## KittuAI

A lightweight chat assistant with provider fallbacks and powerful response utilities.

### Features

- **Conversational chat**: Type a prompt and receive AI responses using a provider cascade (Gemini → OpenAI → Echo).
- **Smart website intent**: If your input is like “open youtube” or “go to google.com”, the app opens the website directly without calling the AI.

- **Response utilities (icon buttons)**
  - **📝 Summarize**: Creates a concise 3–5 bullet summary of the current response.
  - **✨ Clean/Format**: Normalizes whitespace/punctuation, lightly fixes typos, keeps lists and code blocks intact.
  - **🙂 Tone/Sentiment**: Reports sentiment (Positive/Negative/Neutral), top tones, and a one‑line mood.
  - **🏷️ Keywords/Tags**: Generates 5–10 keywords and 3–6 short tags (kebab‑case) for quick organization.
  - **📄 From Text to File**: Export the response as `.txt` (direct download) or open a print‑to‑PDF dialog with a custom filename.

- **Profile & session**
  - Modern profile menu (avatar/initials, name edit, photo upload, help, logout).
  - Session status on load, 30‑minute auto refresh, graceful 401 handling.

- **Polished UI/UX**
  - Overflow‑safe response container (long bullets/markdown wrap neatly inside the glowing box).
  - Small, accessible icon buttons with tooltips and ARIA labels.

### Tech stack

- Frontend: React + Vite
- Backend: Node.js/Express (`server.js`) with `/api/chat` endpoint
- AI Providers: Google Gemini (preferred), OpenAI (fallback), Echo (no keys)

### Quick start

```bash
npm install
npm run dev
```

Set environment variables (see `.env.example`) for provider keys if you want real AI responses.

### Notes

- Voice input (mic) was implemented earlier but is currently removed per project requirements; the app uses text input only.

---

Below is the original Vite template reference.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
