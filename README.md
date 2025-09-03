<<<<<<< HEAD
<<<<<<< HEAD
# AI-Powered_Journaling_Companion
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
=======
# Vibe Journal - AI-Powered Journaling Companion
>>>>>>> b2a4331 (infrastructure & main chat interface)

A conversational AI-powered journaling companion that transforms daily reflection into an engaging conversation.

## 🚀 Features Implemented

### Conversational Chat Interface
- **Chat-style journaling** with AI companion prompts
- **Emoji input support** with automatic emotion parsing
- **Real-time conversation flow** with typing indicators
- **Responsive design** matching the mobile app UI design

### UI Components
- **Header with app branding** (purple-to-blue gradient heart icon)
- **Message bubbles** with proper styling for AI and user messages
- **Input area** with microphone and send buttons
- **Bottom navigation** with 5 tabs: Home, Chat, Insights, History, Settings
- **Save entry functionality** for journal entries

### Technical Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components for consistent UI
- **Lucide React** for icons

## 🏗️ Project Structure

```
src/
├── app/
│   ├── chat/page.tsx          # Main chat interface page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page (redirects to chat)
│   └── globals.css            # Global styles
├── components/
│   ├── chat/
│   │   └── ChatInterface.tsx  # Main chat component
│   ├── navigation/
│   │   └── BottomNavigation.tsx # Bottom tab navigation
│   └── ui/                    # shadcn/ui components
└── lib/
    └── utils.ts               # Utility functions
```

## 🎯 Current Status

✅ **Completed:**
- Basic project setup with Next.js + TypeScript + Tailwind
- Chat interface with AI companion
- Message threading and emoji support
- Bottom navigation structure
- Responsive mobile-first design

🔄 **Next Steps:**
- Local storage with IndexedDB
- Entry saving and retrieval
- AI prompt system
- Pattern analysis and insights
- User onboarding and consent

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Design Features

- **Mobile-first responsive design**
- **Clean, modern UI** with purple-blue gradient branding
- **Chat-style interface** eliminating blank-page anxiety
- **Emoji support** for quick emotional expression
- **Smooth animations** and transitions

<<<<<<< HEAD
Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> ca49c98 (Initial commit from Create Next App)
=======
## 🔒 Privacy & Security

- **Local-first approach** (planned)
- **No data sent to external servers** (planned)
- **User consent controls** (planned)
- **Data export/import** (planned)

---

*Built with ❤️ for mindful journaling and self-reflection*
>>>>>>> b2a4331 (infrastructure & main chat interface)
