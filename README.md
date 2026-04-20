# KittuAI 🤖

KittuAI is an AI-powered chatbot with smart response features, provider fallback system, and a modern UI for a smooth user experience.

---

## ✨ Features

* 💬 Conversational AI chat (Gemini → OpenAI → Echo fallback)
* ⚡ Fast and responsive UI
* 🌐 Smart website detection (e.g., "open youtube")
* 📝 Summarize responses into key points
* ✨ Clean and format text output
* 🙂 Sentiment & tone analysis
* 🏷️ Auto keyword & tag generation
* 📄 Export response to TXT or PDF
* 👤 Profile system (name, avatar, session handling)
* 🔐 Session auto-refresh & authentication handling

---

## 🛠️ Tech Stack

* Frontend: React + Vite
* Backend: Node.js + Express
* AI APIs: Google Gemini (Primary), OpenAI (Fallback)
* Styling: Custom modern UI

---

## 🚀 Quick Start

```bash
npm install
npm run dev
```

---

## ⚙️ Environment Variables

Create a `.env` file and add:

```env
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
JWT_SECRET=your_secret
```

---

## 📁 Project Structure

```
KittuAI/
├── src/           # Frontend (React)
├── public/        # Static files
├── server.js      # Backend (Express)
├── package.json
├── .env
```

---

## 📌 Notes

* Voice input currently disabled (text-only chatbot)
* Uses fallback AI system if API fails
* Designed for learning + real-world use

---

## ⭐ Author

Developed by **Sunil Lohar**
