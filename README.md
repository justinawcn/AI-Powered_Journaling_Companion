# Vibe Journal - AI-Powered Journaling Companion

Demo - https://youtu.be/-oZXv-ix384 (recommended playspeed- 1.5X)

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--3.5--turbo-412991?style=for-the-badge&logo=openai" alt="OpenAI" />
</div>

<br>

A conversational AI-powered journaling companion that transforms daily reflection into an engaging conversation. Vibe Journal eliminates the intimidation of blank pages by providing an AI companion that asks thoughtful questions, analyzes your emotional patterns, and helps you understand yourself better—all while keeping your most personal thoughts completely private.

## ✨ Key Features

### 🤖 Conversational AI Interface
- **Chat-style journaling** that feels like texting a friend, not writing homework
- **Intelligent follow-up questions** that deepen your self-reflection
- **Emoji support** with automatic emotion parsing and mood detection
- **Real-time conversation flow** with typing indicators and smooth animations

### 🧠 AI-Powered Insights
- **Sentiment Analysis**: Understand the emotional tone of your entries
- **Pattern Recognition**: Identify recurring themes and topics in your thoughts
- **Trend Analysis**: Track your journaling habits and emotional patterns over time
- **Hybrid AI Approach**: Works with or without internet connection

### 🔒 Privacy-First Design
- **Local-first storage** using IndexedDB - your data never leaves your device
- **Optional encryption** with AES-GCM 256-bit encryption and PBKDF2 key derivation
- **No external servers** - everything runs locally in your browser
- **Full data control** with export/import capabilities

### 📱 Modern User Experience
- **Mobile-first responsive design** that works seamlessly across devices
- **Smart search and filtering** by date, mood, keywords, or emojis
- **Automatic entry saving** - no manual save buttons needed
- **Beautiful, calming interface** with purple-blue gradient branding

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vibe-journal.git
   cd vibe-journal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional)**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your OpenAI API key for advanced AI analysis:
   ```bash
   NEXT_PUBLIC_OPENAI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15.5.2 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui components
- **Storage**: IndexedDB for local data persistence
- **AI**: OpenAI GPT-3.5-turbo with local fallback analysis
- **Encryption**: Web Crypto API (AES-GCM, PBKDF2)

### Project Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── chat/              # Main chat interface
│   ├── insights/          # AI analysis dashboard
│   ├── history/           # Journal entry browser
│   ├── settings/          # Privacy and data controls
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── chat/              # Chat interface components
│   ├── navigation/        # Bottom navigation
│   └── ui/                # shadcn/ui components
└── lib/                   # Core business logic
    ├── aiService.ts       # AI analysis engine
    ├── database.ts        # IndexedDB management
    ├── encryption.ts      # Privacy and security
    └── storageService.ts  # Data persistence layer
```

## 🔧 Core Mechanisms

### Encryption & Security
- **AES-GCM 256-bit** encryption for journal entries
- **PBKDF2** key derivation with 100,000 iterations
- **16-byte random salt** stored locally
- **96-bit IV** generated for each encryption operation

### AI Analysis Pipeline
- **Hybrid approach**: OpenAI API + local analysis
- **Rate limiting**: 5-second delays, 10 requests/minute
- **Caching**: 24-hour cache with automatic invalidation
- **Privacy protection**: Only unencrypted content sent to API

### Session Management
- **Automatic saving**: Each message becomes a journal entry
- **Session grouping**: Related entries grouped by conversation
- **Smart deduplication**: Automatic cleanup of duplicate entries
- **Full data control**: Export/import with encryption support

## 📊 Features in Detail

### Chat Interface
- Conversational AI companion with contextual responses
- Automatic emoji extraction and mood detection
- Real-time typing indicators and smooth animations
- Auto-save functionality with no manual intervention needed

### Insights Dashboard
- **Sentiment Analysis**: Overall emotional tone with confidence scores
- **Pattern Analysis**: Recurring themes and topic frequency
- **Trend Analysis**: Writing consistency, mood trends, and emoji usage
- **Visual indicators**: Color-coded sentiment and mood badges

### History Browser
- **Advanced search**: Filter by content, date, mood, or emojis
- **Visual timeline**: See your emotional journey over time
- **Rich metadata**: Timestamps, mood indicators, and emoji collections
- **Export capabilities**: Full data backup in JSON format

### Privacy Controls
- **Encryption toggle**: Enable/disable with custom password
- **Data export**: Complete backup of all entries and sessions
- **Storage statistics**: Monitor data usage and cleanup options
- **Local-only processing**: No external data transmission

## 🎯 Use Cases

- **Daily Reflection**: Transform journaling from a chore into an engaging conversation
- **Emotional Intelligence**: Understand your emotional patterns and triggers
- **Personal Growth**: Track progress and identify areas for improvement
- **Privacy-Conscious Users**: Keep personal thoughts completely private
- **Mobile-First Users**: Seamless experience across all devices

## 🔮 Future Roadmap

- [ ] **Voice Input**: Speech-to-text for hands-free journaling
- [ ] **Mood Tracking**: Visual mood charts and emotional trends
- [ ] **Goal Setting**: AI-assisted personal development planning
- [ ] **Social Features**: Optional sharing with trusted contacts
- [ ] **Offline PWA**: Full offline functionality with service workers
- [ ] **Multi-language Support**: Internationalization for global users

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [Tailwind CSS](https://tailwindcss.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- AI powered by [OpenAI](https://openai.com/)

## 📞 Support

- **Documentation**: Check our [AI Setup Guide](AI_SETUP.md) for configuration help
- **Issues**: Report bugs or request features on [GitHub Issues](https://github.com/yourusername/vibe-journal/issues)
- **Discussions**: Join the conversation in [GitHub Discussions](https://github.com/yourusername/vibe-journal/discussions)

---

<div align="center">
  <p><strong>Built with ❤️ for mindful journaling and self-reflection</strong></p>
  <p>Transform your daily reflection into an engaging conversation with AI</p>
</div>
