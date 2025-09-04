# Design Documentation - Vibe Journal

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Technical Architecture](#technical-architecture)
3. [UI/UX Design System](#uiux-design-system)
4. [Component Architecture](#component-architecture)
5. [Data Architecture](#data-architecture)
6. [Security & Privacy Design](#security--privacy-design)
7. [Performance Considerations](#performance-considerations)
8. [Accessibility](#accessibility)
9. [Responsive Design](#responsive-design)
10. [Future Design Considerations](#future-design-considerations)

---

## Design Philosophy

### Core Principles

**1. Privacy-First Design**
- All user data remains on the device by default
- Encryption is optional but seamlessly integrated
- No external data transmission without explicit consent
- Transparent data handling with full user control

**2. Conversational Interface**
- Transform journaling from a solitary task into an engaging conversation
- Eliminate blank page anxiety through AI-guided prompts
- Natural language interaction that feels like texting a friend
- Progressive disclosure of features to avoid overwhelming users

**3. Mobile-First Approach**
- Primary interaction designed for mobile devices
- Touch-optimized interface with appropriate tap targets
- Responsive design that scales gracefully to larger screens
- Native app-like experience in the browser

**4. Emotional Intelligence**
- Visual design that promotes calm and reflection
- Emoji integration for quick emotional expression
- Mood-aware interface that adapts to user's emotional state
- Gentle, supportive AI responses that encourage growth

---

## Technical Architecture

### Frontend Stack

**Core Framework: Next.js 15.5.2**
- **App Router**: Modern routing with server components
- **TypeScript**: Full type safety across the application
- **React 19**: Latest React features with concurrent rendering
- **Server-Side Rendering**: Improved performance and SEO

**Styling & UI**
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible component library
- **Lucide React**: Consistent icon system
- **CSS Variables**: Dynamic theming support

**State Management**
- **React Hooks**: Local state management with useState/useEffect
- **Context API**: Global state for user preferences and settings
- **Custom Hooks**: Reusable logic for viewport handling and data fetching

### Backend & Storage

**Local-First Architecture**
- **IndexedDB**: Primary data storage using Dexie.js abstraction
- **Web Crypto API**: Client-side encryption and key management
- **LocalStorage**: Settings and encryption salt storage
- **Service Workers**: Future offline functionality (planned)

**AI Integration**
- **OpenAI GPT-3.5-turbo**: Advanced natural language processing
- **Hybrid Approach**: Local analysis fallback for privacy
- **Rate Limiting**: Intelligent request throttling
- **Caching Strategy**: 24-hour cache with automatic invalidation

---

## UI/UX Design System

### Color Palette

**Primary Colors**
```css
--primary: 221.2 83.2% 53.3%;        /* Blue-600 */
--primary-foreground: 210 40% 98%;   /* White */
```

**Brand Colors**
- **Purple-Blue Gradient**: `from-purple-500 to-blue-500`
- **Heart Icon**: Gradient background for brand recognition
- **Accent Blue**: `#3B82F6` for interactive elements

**Semantic Colors**
```css
--success: 142 76% 36%;              /* Green-600 */
--warning: 38 92% 50%;               /* Yellow-500 */
--destructive: 0 84.2% 60.2%;        /* Red-500 */
--muted: 210 40% 96%;                /* Gray-100 */
```

### Typography

**Font Stack**
- **Primary**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Type Scale**
- **H1**: 2rem (32px) - Page titles
- **H2**: 1.5rem (24px) - Section headers
- **H3**: 1.25rem (20px) - Card titles
- **Body**: 1rem (16px) - Default text
- **Small**: 0.875rem (14px) - Secondary text
- **Caption**: 0.75rem (12px) - Timestamps, labels

### Spacing System

**Tailwind Spacing Scale**
- **xs**: 0.25rem (4px) - Fine adjustments
- **sm**: 0.5rem (8px) - Small gaps
- **md**: 1rem (16px) - Standard spacing
- **lg**: 1.5rem (24px) - Section spacing
- **xl**: 2rem (32px) - Large sections
- **2xl**: 3rem (48px) - Page margins

### Border Radius

**Consistent Rounding**
- **sm**: 0.25rem (4px) - Small elements
- **md**: 0.375rem (6px) - Buttons, inputs
- **lg**: 0.5rem (8px) - Cards, containers
- **xl**: 0.75rem (12px) - Large containers
- **2xl**: 1rem (16px) - Message bubbles

---

## Component Architecture

### Design System Components

**shadcn/ui Integration**
```typescript
// Component structure
src/components/ui/
├── avatar.tsx          // User profile images
├── badge.tsx           // Status indicators
├── button.tsx          // Interactive elements
├── card.tsx            // Content containers
├── input.tsx           // Form inputs
└── textarea.tsx        // Multi-line text
```

**Custom Components**
```typescript
src/components/
├── chat/
│   └── ChatInterface.tsx    // Main conversation UI
└── navigation/
    └── BottomNavigation.tsx // Tab navigation
```

### Component Patterns

**1. Compound Components**
```typescript
// Card component with header, content, footer
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

**2. Polymorphic Components**
```typescript
// Button with variant and size props
<Button variant="primary" size="lg">
  Action
</Button>
```

**3. Custom Hooks**
```typescript
// Reusable logic encapsulation
const { height } = useViewportHeight();
const { entries, saveEntry } = useJournalEntries();
```

### State Management Patterns

**Local State**
- Component-level state with useState
- Form state with controlled components
- UI state (modals, loading, etc.)

**Global State**
- User preferences and settings
- Encryption state and keys
- Theme and appearance settings

**Server State**
- Journal entries and sessions
- AI analysis results
- Cache management

---

## Data Architecture

### Database Schema

**Journal Entries**
```typescript
interface JournalEntry {
  id: string;                    // UUID
  content: string | ArrayBuffer; // Text or encrypted data
  emojis: string[];              // Extracted emojis
  timestamp: Date;               // Creation time
  encrypted: boolean;            // Encryption status
  iv?: Uint8Array;              // Initialization vector
  tags?: string[];              // User-defined tags
  mood?: string;                // Detected mood
  createdAt: Date;              // Record creation
  updatedAt: Date;              // Last modification
}
```

**Chat Sessions**
```typescript
interface ChatSession {
  id: string;           // UUID
  entryIds: string[];   // References to entries
  startTime: Date;      // Session start
  endTime?: Date;       // Session end
  summary?: string;     // AI-generated summary
}
```

### Data Flow

**1. Entry Creation**
```
User Input → Emoji Extraction → Mood Detection → Encryption (optional) → IndexedDB
```

**2. AI Analysis**
```
Entries → Cache Check → API/Local Analysis → Result Caching → UI Update
```

**3. Data Retrieval**
```
Query → IndexedDB → Decryption (if needed) → UI Rendering
```

### Storage Strategy

**IndexedDB Structure**
```typescript
// Object stores
STORES = {
  ENTRIES: 'journalEntries',    // Journal entries
  SESSIONS: 'chatSessions',     // Chat sessions
  SETTINGS: 'userSettings',     // User preferences
}
```

**Indexing Strategy**
- **timestamp**: Chronological ordering
- **tags**: Multi-entry tag search
- **createdAt**: Record management
- **startTime**: Session ordering

---

## Security & Privacy Design

### Encryption Architecture

**AES-GCM 256-bit Encryption**
```typescript
// Key derivation
PBKDF2(password, salt, 100000, SHA-256) → AES-GCM key

// Encryption process
AES-GCM(plaintext, key, 96-bit IV) → encrypted data + IV
```

**Key Management**
- **Password-based**: User-provided password
- **Salt Storage**: 16-byte random salt in localStorage
- **Key Derivation**: 100,000 PBKDF2 iterations
- **IV Generation**: 96-bit random IV per encryption

### Privacy Controls

**Data Minimization**
- Only necessary data is collected
- Optional features require explicit opt-in
- Clear data usage explanations

**User Control**
- Full data export capabilities
- Selective data deletion
- Encryption toggle
- API key management

**Transparency**
- Clear privacy policy
- Data flow documentation
- Open source codebase
- Regular security audits

---

## Performance Considerations

### Frontend Optimization

**Code Splitting**
- Route-based code splitting with Next.js
- Dynamic imports for heavy components
- Lazy loading of non-critical features

**Bundle Optimization**
- Tree shaking for unused code
- Image optimization with Next.js
- Font optimization with Google Fonts

**Caching Strategy**
- AI analysis results cached for 24 hours
- Component-level memoization
- Service worker caching (planned)

### Data Performance

**IndexedDB Optimization**
- Efficient indexing for fast queries
- Batch operations for bulk updates
- Connection pooling and reuse

**AI Request Optimization**
- Rate limiting to prevent API abuse
- Request deduplication
- Intelligent caching with invalidation

### Mobile Performance

**Viewport Optimization**
```typescript
// Custom viewport height handling
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);
```

**Touch Optimization**
- Appropriate tap target sizes (44px minimum)
- Smooth scrolling and momentum
- Reduced motion for accessibility

---

## Accessibility

### WCAG 2.1 Compliance

**Level AA Standards**
- Color contrast ratios meet 4.5:1 minimum
- Keyboard navigation support
- Screen reader compatibility
- Focus management

**Semantic HTML**
```typescript
// Proper semantic structure
<main role="main">
  <section aria-labelledby="chat-heading">
    <h1 id="chat-heading">Chat</h1>
  </section>
</main>
```

**ARIA Labels**
- Descriptive labels for interactive elements
- Live regions for dynamic content
- State announcements for UI changes

### Inclusive Design

**Visual Accessibility**
- High contrast mode support
- Scalable text and UI elements
- Color-blind friendly palette
- Reduced motion preferences

**Motor Accessibility**
- Large touch targets
- Keyboard shortcuts
- Voice input support (planned)
- Gesture alternatives

---

## Responsive Design

### Breakpoint Strategy

**Mobile-First Approach**
```css
/* Base styles for mobile */
.container { padding: 1rem; }

/* Tablet and up */
@media (min-width: 768px) {
  .container { padding: 2rem; }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container { max-width: 1200px; margin: 0 auto; }
}
```

**Tailwind Breakpoints**
- **sm**: 640px - Small tablets
- **md**: 768px - Tablets
- **lg**: 1024px - Laptops
- **xl**: 1280px - Desktops
- **2xl**: 1536px - Large screens

### Layout Adaptations

**Mobile Layout**
- Single column layout
- Bottom navigation
- Full-screen chat interface
- Swipe gestures

**Tablet Layout**
- Two-column layout possible
- Side navigation option
- Larger touch targets
- Landscape orientation support

**Desktop Layout**
- Multi-column layout
- Sidebar navigation
- Hover states
- Keyboard shortcuts

---

## Future Design Considerations

### Planned Enhancements

**Voice Interface**
- Speech-to-text integration
- Voice command navigation
- Audio journaling capabilities
- Accessibility improvements

**Advanced AI Features**
- Emotion recognition from voice
- Predictive text suggestions
- Personalized conversation starters
- Mood-based interface adaptation

**Social Features**
- Optional sharing with trusted contacts
- Group journaling sessions
- Anonymous community insights
- Mentor/coach integration

**Offline Capabilities**
- Progressive Web App (PWA)
- Service worker implementation
- Offline-first architecture
- Background sync

### Design System Evolution

**Component Library Expansion**
- Advanced form components
- Data visualization components
- Animation and transition library
- Theme customization tools

**Accessibility Improvements**
- Voice navigation
- High contrast themes
- Screen reader optimization
- Motor accessibility features

**Performance Enhancements**
- Virtual scrolling for large datasets
- Image optimization and lazy loading
- Advanced caching strategies
- Bundle size optimization

---

## Design Decision Records

### Key Decisions

**1. Chat Interface vs Traditional Journal**
- **Decision**: Conversational interface
- **Rationale**: Reduces blank page anxiety, increases engagement
- **Trade-offs**: More complex UI, requires AI integration

**2. Local-First vs Cloud Storage**
- **Decision**: Local-first with optional cloud
- **Rationale**: Privacy concerns, offline capability
- **Trade-offs**: Limited sync, device dependency

**3. Hybrid AI Approach**
- **Decision**: OpenAI API + local fallback
- **Rationale**: Best of both worlds - advanced AI with privacy
- **Trade-offs**: Complexity, cost management

**4. Mobile-First Design**
- **Decision**: Mobile-first responsive design
- **Rationale**: Primary use case is mobile journaling
- **Trade-offs**: Desktop experience secondary

**5. Encryption as Optional**
- **Decision**: User-controlled encryption
- **Rationale**: Flexibility, ease of use
- **Trade-offs**: Security complexity, user education needed

---

*This documentation serves as a living document that evolves with the project. Regular updates ensure alignment between design decisions and implementation.*
