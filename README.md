# Daily Standup Generator

A high-performance React application that converts raw engineering notes, voice dictation, and ticket data into professional, structured daily standup updates using **Google Gemini Pro**.

This tool is designed for engineers who want to maintain a consistent project narrative, detect contradictions in their timeline, and automate the tedious parts of daily reporting.

## ✨ Key Features

### 🤖 Intelligent Synthesis
- **Context-Aware Generation**: Automatically compares your current notes with yesterday's standup to detect "zombie tasks" or logical contradictions.
- **Refinement Chat**: Tweak your results in real-time. Use the floating suggestion bar to change tone, add details, or fix formatting.

### 🎫 Integrated Task Tracking
- **Jira-Style Ticket Manager**: Keep a local or synced list of active tickets.
- **Checkbox Injection**: In-progress tickets appear as interactive chips in the drafting area. Click to instantly add them to your daily log.

### 📱 Premium Mobile Experience
- **Immersive Preview**: On mobile, the preview area maximizes viewport usage with a floating refinement interface for rapid editing.
- **Intelligent Navigation**: The app stays on the "Drafting" tab during processing and only switches to "Preview" once the AI successfully generates your content.
- **Voice Dictation**: Built-in support for hands-free drafting using high-accuracy speech-to-text.

### ☁️ Storage & Sync
- **Local-First, Cloud-Enabled**: Works offline using LocalStorage. Connect **Supabase** to sync your history across devices.
- **Manual Backfill**: Add past standups manually to the history to build a stronger context for the AI.
- **Chronological Sorting**: History is automatically organized by date, regardless of when you added the entry.
- **Data Export**: Download your complete standup history as a JSON file for backup or reporting.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com/app/apikey))
- (Optional) A Supabase Project for cloud sync

### Quick Start

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/daily-standup-generator.git
   cd daily-standup-generator
   npm install
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

3. **Configure API Key**
   - On first launch, you'll be prompted to enter your Gemini API key
   - Click the settings icon (⚙️) in the header to add or update your API key
   - Your API key is stored securely in your browser's localStorage
   - The key is never logged or sent anywhere except Google's Gemini API

4. **Supabase Setup (Optional)**
   - To enable cloud sync across devices, you'll need a Supabase project
   - Get your project URL and `anon` public key from [app.supabase.com](https://app.supabase.com)
   - Enter these credentials in the app's settings (⚙️ icon)
   - Your Supabase credentials are stored locally in your browser's localStorage
   - The app will automatically switch from local-only to cloud-synced mode once configured

## 📖 Usage Guide

1. **Draft**: Enter raw thoughts, bullet points, or use the **Rec** button to speak.
2. **Context**: Ensure "Context Reference" is toggled ON to let the AI see your last update for consistency checking.
3. **Synthesize**: Click the button. The app will process your notes and automatically switch to the preview view once finished.
4. **Refine**: See an issue? Use the "Suggest a tweak" bar at the bottom to adjust the result.
5. **Save**: Click "Save" to commit the entry to your history.
6. **Manage Tickets**: Switch to the "Jira" tab to track your current sprint tasks.

## 📂 Project Structure
## 🛠️ Tech Stack

The application is organized to separate UI concerns from AI and data logic:

```text
src/
├── components/
│   ├── drafting/       # Note input, Voice dictation, and Context controls
│   ├── preview/        # AI output display and Refinement interface
│   ├── tickets/        # Jira-style task management and Checkbox injection
│   └── shared/         # Reusable UI elements (Buttons, Cards, Modals)
├── hooks/
│   ├── useGemini.js    # Interface with Google Gemini Pro API
│   ├── useDictation.js # Browser Speech Recognition integration
│   └── useStore.js     # State management for tickets and history
├── lib/
│   ├── gemini.js       # AI model configuration and prompt engineering
│   └── supabase.js     # Database connection and sync logic
└── App.jsx             # Main application layout and routing
```

## �️ Tech Stack

- **Framework**: React 19 (ES6 Modules)
- **AI**: Google GenAI SDK (Gemini 3 Pro)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS (Mobile-First)
- **PWA**: Workbox (Offline Capabilities)
- **Icons**: Lucide-style SVG icons

---
*Built for engineers, by engineers.*