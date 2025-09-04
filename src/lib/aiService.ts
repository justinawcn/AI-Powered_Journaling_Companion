// AI Service for journal entry analysis
import { JournalEntry } from './database';

// AI Analysis Types
export type AnalysisType = 'sentiment' | 'patterns' | 'trends';

export interface AIAnalysisRequest {
  entries: JournalEntry[];
  analysisType: AnalysisType;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export interface SentimentAnalysisResult {
  type: 'sentiment';
  data: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number; // -1 to 1
    entrySentiments: Array<{
      entryId: string;
      sentiment: 'positive' | 'negative' | 'neutral';
      score: number;
      confidence: number;
    }>;
  };
  confidence: number;
  timestamp: Date;
}

export interface PatternAnalysisResult {
  type: 'patterns';
  data: {
    patterns: Array<{
      name: string;
      frequency: number;
      entries: string[];
      keywords: string[];
    }>;
    topPatterns: string[];
  };
  confidence: number;
  timestamp: Date;
}

export interface TrendAnalysisResult {
  type: 'trends';
  data: {
    moodTrends: Array<{
      date: string;
      mood: string;
      count: number;
    }>;
    consistency: {
      averageEntriesPerWeek: number;
      mostActiveDay: string;
      writingStreak: number;
    };
    emojiUsage: Array<{
      emoji: string;
      count: number;
      frequency: number;
    }>;
  };
  confidence: number;
  timestamp: Date;
}

export type AIAnalysisResult = SentimentAnalysisResult | PatternAnalysisResult | TrendAnalysisResult;

// Cache Management
interface CacheEntry {
  result: AIAnalysisResult;
  timestamp: Date;
  entryCount: number; // Track number of entries when cached
}

// Rate Limiting Management
interface RateLimitState {
  lastRequestTime: number;
  requestCount: number;
  resetTime: number;
}

export class AIService {
  private cache = new Map<string, CacheEntry>();
  private apiKey: string | null = null;
  private isInitialized = false;
  private rateLimitState: RateLimitState = {
    lastRequestTime: 0,
    requestCount: 0,
    resetTime: 0,
  };
  private pendingRequests = new Map<string, Promise<AIAnalysisResult>>();

  // Rate limiting configuration
  private readonly RATE_LIMIT_REQUESTS_PER_MINUTE = 3;
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly REQUEST_DELAY = 2000; // 2 seconds between requests

  // Initialize with API key from environment
  async initialize(): Promise<void> {
    try {
      this.apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || null;
      
      if (!this.apiKey) {
        console.warn('OpenAI API key not found. AI analysis will be limited to local processing.');
      }
      
      this.isInitialized = true;
      console.log('AI Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw new Error('AI service initialization failed');
    }
  }

  // Main analysis method - hybrid approach with improved rate limiting
  async analyzeEntries(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey, request.entries.length);
    if (cachedResult) {
      console.log('Using cached analysis result');
      return cachedResult;
    }

    // Check if there's already a pending request for the same analysis
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`Waiting for pending ${request.analysisType} analysis...`);
      return this.pendingRequests.get(cacheKey)!;
    }

    console.log(`Running ${request.analysisType} analysis on ${request.entries.length} entries`);

    // Create a promise for this analysis and store it to prevent duplicates
    const analysisPromise = this.performAnalysis(request, cacheKey);
    this.pendingRequests.set(cacheKey, analysisPromise);

    try {
      const result = await analysisPromise;
      return result;
    } finally {
      // Clean up the pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async performAnalysis(request: AIAnalysisRequest, cacheKey: string): Promise<AIAnalysisResult> {
    try {
      let result: AIAnalysisResult;

      // For sentiment analysis, try AI first if we have unencrypted content
      if (this.apiKey && request.analysisType === 'sentiment' && this.canMakeAPIRequest()) {
        const hasUnencryptedContent = request.entries.some(entry => 
          typeof entry.content === 'string' && entry.content.trim() !== ''
        );
        
        if (hasUnencryptedContent) {
          try {
            // Add delay for rate limiting
            await this.enforceRateLimit();
            result = await this.runAIAnalysis(request);
            this.updateRateLimitState();
          } catch (apiError) {
            console.warn('AI API failed, falling back to local analysis:', apiError);
            result = await this.runLocalAnalysis(request);
          }
        } else {
          // No unencrypted content, use local analysis
          result = await this.runLocalAnalysis(request);
        }
      } else {
        // For patterns, trends, or when rate limited, use local analysis
        result = await this.runLocalAnalysis(request);
      }

      // Cache the result
      this.cacheResult(cacheKey, result, request.entries.length);
      
      return result;
    } catch (error) {
      console.error('Analysis failed:', error);
      throw new Error('Analysis service is currently unavailable. Please try again later.');
    }
  }

  // Rate limiting methods
  private canMakeAPIRequest(): boolean {
    const now = Date.now();
    
    // Reset count if window has passed
    if (now > this.rateLimitState.resetTime) {
      this.rateLimitState.requestCount = 0;
      this.rateLimitState.resetTime = now + this.RATE_LIMIT_WINDOW;
    }

    return this.rateLimitState.requestCount < this.RATE_LIMIT_REQUESTS_PER_MINUTE;
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.rateLimitState.lastRequestTime;
    
    if (timeSinceLastRequest < this.REQUEST_DELAY) {
      const waitTime = this.REQUEST_DELAY - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms before API request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private updateRateLimitState(): void {
    this.rateLimitState.lastRequestTime = Date.now();
    this.rateLimitState.requestCount++;
  }

  // AI API Analysis (OpenAI) - optimized prompts
  private async runAIAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    if (!this.apiKey) {
      throw new Error('API key not available');
    }

    const prompt = this.buildConsolidatedPrompt(request);
    
    // 🔍 DEBUG: Log what we're sending to AI
    console.group('🤖 AI API Request Debug');
    console.log('📊 Analysis Type:', request.analysisType);
    console.log('📝 Total Entries:', request.entries.length);
    console.log('🔓 Unencrypted Entries:', request.entries.filter(e => typeof e.content === 'string').length);
    console.log('🔒 Encrypted Entries:', request.entries.filter(e => typeof e.content !== 'string').length);
    console.log('📏 Prompt Length:', prompt.length, 'characters');
    console.log('📄 Full Prompt:', prompt);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that analyzes journal entries. Provide structured, helpful insights about the user\'s thoughts and emotions. Return only valid JSON responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800, // Reduced token usage
        temperature: 0.2, // Lower temperature for more consistent results
      }),
    });

    if (!response.ok) {
      console.error('❌ OpenAI API Error:', response.status, response.statusText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // 🔍 DEBUG: Log API response
    console.group('🤖 AI API Response Debug');
    console.log('📊 Analysis Type:', request.analysisType);
    console.log('✅ Response Status:', response.status);
    console.log('📄 Response Content:', data.choices[0].message.content);
    console.log('⏰ Response Time:', new Date().toISOString());
    console.groupEnd();
    
    return this.parseAIResponse(request.analysisType, data.choices[0].message.content, request.entries);
  }

  // Local Analysis (fallback)
  private async runLocalAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    switch (request.analysisType) {
      case 'sentiment':
        return this.analyzeSentimentLocally(request.entries);
      case 'patterns':
        return this.analyzePatternsLocally(request.entries);
      case 'trends':
        return this.analyzeTrendsLocally(request.entries);
      default:
        throw new Error(`Unknown analysis type: ${request.analysisType}`);
    }
  }

  // Enhanced local sentiment analysis
  private analyzeSentimentLocally(entries: JournalEntry[]): SentimentAnalysisResult {
    const positiveWords = ['happy', 'good', 'great', 'amazing', 'wonderful', 'love', 'excited', 'joy', 'smile', 'laugh', 'grateful', 'blessed', 'proud', 'accomplished', 'peaceful'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'worried', 'anxious', 'cry', 'depressed', 'stressed', 'overwhelmed', 'disappointed', 'lonely'];

    const entrySentiments = entries.map(entry => {
      const content = typeof entry.content === 'string' ? entry.content.toLowerCase() : '';
      const positiveCount = positiveWords.filter(word => content.includes(word)).length;
      const negativeCount = negativeWords.filter(word => content.includes(word)).length;
      
      let sentiment: 'positive' | 'negative' | 'neutral';
      let score: number;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = Math.min(positiveCount / 10, 1);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = Math.min(-negativeCount / 10, -1);
      } else {
        sentiment = 'neutral';
        score = 0;
      }

      return {
        entryId: entry.id,
        sentiment,
        score,
        confidence: Math.abs(score) * 0.8, // Improved confidence for local analysis
      };
    });

    const overallScore = entrySentiments.reduce((sum, entry) => sum + entry.score, 0) / entries.length;
    const overallSentiment = overallScore > 0.1 ? 'positive' : overallScore < -0.1 ? 'negative' : 'neutral';

    return {
      type: 'sentiment',
      data: {
        overallSentiment,
        sentimentScore: overallScore,
        entrySentiments,
      },
      confidence: 0.7, // Improved confidence for local analysis
      timestamp: new Date(),
    };
  }

  // Enhanced local pattern analysis
  private analyzePatternsLocally(entries: JournalEntry[]): PatternAnalysisResult {
    const wordCount = new Map<string, number>();
    const entryPatterns = new Map<string, Set<string>>();
    
    // Common stop words to filter out
    const stopWords = new Set(['this', 'that', 'with', 'have', 'will', 'been', 'were', 'they', 'them', 'their', 'there', 'when', 'where', 'what', 'would', 'could', 'should', 'about', 'after', 'before', 'during', 'through', 'really', 'think', 'feel', 'just', 'like', 'want', 'need', 'know', 'time', 'today', 'yesterday', 'tomorrow']);

    entries.forEach(entry => {
      const content = typeof entry.content === 'string' ? entry.content.toLowerCase() : '';
      const words = content.split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.has(word))
        .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
        .filter(word => word.length > 3);
      
      words.forEach(word => {
        const count = wordCount.get(word) || 0;
        wordCount.set(word, count + 1);
        
        if (!entryPatterns.has(word)) {
          entryPatterns.set(word, new Set());
        }
        entryPatterns.get(word)!.add(entry.id);
      });
    });

    const patterns = Array.from(wordCount.entries())
      .filter(([word, count]) => count >= 2) // Only words that appear multiple times
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Top 10 patterns
      .map(([word, frequency]) => ({
        name: word,
        frequency,
        entries: Array.from(entryPatterns.get(word) || []),
        keywords: [word],
      }));

    return {
      type: 'patterns',
      data: {
        patterns,
        topPatterns: patterns.slice(0, 5).map(pattern => pattern.name),
      },
      confidence: 0.6, // Improved confidence for local analysis
      timestamp: new Date(),
    };
  }

  // Local trend analysis (data aggregation)
  private analyzeTrendsLocally(entries: JournalEntry[]): TrendAnalysisResult {
    // Mood trends
    const moodCounts = new Map<string, number>();
    const dailyMoods = new Map<string, Map<string, number>>();

    entries.forEach(entry => {
      const mood = entry.mood || 'neutral';
      const date = entry.timestamp.toISOString().split('T')[0];
      
      moodCounts.set(mood, (moodCounts.get(mood) || 0) + 1);
      
      if (!dailyMoods.has(date)) {
        dailyMoods.set(date, new Map());
      }
      const dayMoods = dailyMoods.get(date)!;
      dayMoods.set(mood, (dayMoods.get(mood) || 0) + 1);
    });

    const moodTrends = Array.from(dailyMoods.entries()).map(([date, moods]) => {
      const mostFrequentMood = Array.from(moods.entries())
        .sort(([, a], [, b]) => b - a)[0];
      
      return {
        date,
        mood: mostFrequentMood[0],
        count: mostFrequentMood[1],
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    // Consistency analysis
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = new Map<string, number>();
    
    entries.forEach(entry => {
      const day = daysOfWeek[entry.timestamp.getDay()];
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    });

    const mostActiveDay = Array.from(dayCounts.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Unknown';

    // Emoji usage
    const emojiCounts = new Map<string, number>();
    entries.forEach(entry => {
      entry.emojis.forEach(emoji => {
        emojiCounts.set(emoji, (emojiCounts.get(emoji) || 0) + 1);
      });
    });

    const emojiUsage = Array.from(emojiCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([emoji, count]) => ({
        emoji,
        count,
        frequency: count / entries.length,
      }));

    return {
      type: 'trends',
      data: {
        moodTrends,
        consistency: {
          averageEntriesPerWeek: entries.length / Math.max(1, this.getWeeksBetween(entries)),
          mostActiveDay,
          writingStreak: this.calculateWritingStreak(entries),
        },
        emojiUsage,
      },
      confidence: 0.9, // High confidence for data aggregation
      timestamp: new Date(),
    };
  }

  // Cache management methods
  private generateCacheKey(request: AIAnalysisRequest): string {
    const entryIds = request.entries.map(e => e.id).sort().join(',');
    const timeRange = request.timeRange ? 
      `${request.timeRange.start.toISOString()}-${request.timeRange.end.toISOString()}` : 
      'all';
    return `${request.analysisType}-${timeRange}-${entryIds}`;
  }

  private getCachedResult(cacheKey: string, currentEntryCount: number): AIAnalysisResult | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // Invalidate cache if new entries were added
    if (cached.entryCount !== currentEntryCount) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Cache is valid for 24 hours
    const isExpired = Date.now() - cached.timestamp.getTime() > 24 * 60 * 60 * 1000;
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.result;
  }

  private cacheResult(cacheKey: string, result: AIAnalysisResult, entryCount: number): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: new Date(),
      entryCount,
    });
  }

  // Clear cache (call when new entries are added)
  clearCache(): void {
    this.cache.clear();
    console.log('AI analysis cache cleared');
  }

  // Simplified prompt building - only for sentiment analysis (AI-only)
  private buildConsolidatedPrompt(request: AIAnalysisRequest): string {
    // Only sentiment analysis uses AI
    if (request.analysisType !== 'sentiment') {
      throw new Error(`AI analysis not supported for type: ${request.analysisType}`);
    }

    // Filter and consolidate only unencrypted content
    const unencryptedEntries = request.entries
      .map((entry, index) => ({ index, content: entry.content }))
      .filter(entry => typeof entry.content === 'string' && entry.content.trim() !== '');
    
    if (unencryptedEntries.length === 0) {
      throw new Error('No unencrypted content available for AI analysis');
    }

    // Create consolidated text feed
    const consolidatedText = unencryptedEntries
      .map(entry => `Entry ${entry.index + 1}: ${entry.content}`)
      .join('\n\n');

    return `Analyze the sentiment of these journal entries. Provide an overall sentiment analysis and per-entry analysis.

Journal Entries:
${consolidatedText}

Respond with JSON:
{
  "overallSentiment": "positive|negative|neutral",
  "sentimentScore": -1 to 1,
  "entrySentiments": [
    {
      "entryIndex": number,
      "sentiment": "positive|negative|neutral", 
      "score": -1 to 1,
      "confidence": 0 to 1
    }
  ]
}`;
  }

  // Updated response parser to handle optimized responses
  private parseAIResponse(analysisType: AnalysisType, response: string, entries: JournalEntry[]): AIAnalysisResult {
    try {
      const data = JSON.parse(response);
      
      // Only sentiment analysis uses AI
      if (analysisType !== 'sentiment') {
        throw new Error(`AI response parsing not supported for type: ${analysisType}`);
      }

      // Map entry indices back to IDs
      const entrySentiments = data.entrySentiments.map((item: { entryIndex: number; sentiment: string; score: number; confidence: number }) => ({
        entryId: entries[item.entryIndex]?.id || `entry-${item.entryIndex}`,
        sentiment: item.sentiment,
        score: item.score,
        confidence: item.confidence,
      }));

      return {
        type: 'sentiment',
        data: {
          overallSentiment: data.overallSentiment,
          sentimentScore: data.sentimentScore,
          entrySentiments,
        },
        confidence: 0.9, // High confidence for AI analysis
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI analysis response');
    }
  }

  private getWeeksBetween(entries: JournalEntry[]): number {
    if (entries.length === 0) return 1;
    
    const dates = entries.map(e => e.timestamp.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    
    return Math.max(1, Math.ceil((maxDate - minDate) / (7 * 24 * 60 * 60 * 1000)));
  }

  private calculateWritingStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;
    
    const dates = [...new Set(entries.map(e => e.timestamp.toDateString()))]
      .map(dateStr => new Date(dateStr))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const date of dates) {
      const diffTime = currentDate.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }
    
    return streak;
  }
}

// Singleton instance
export const aiService = new AIService();