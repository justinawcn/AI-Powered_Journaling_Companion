'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { useViewportHeight } from '@/lib/useViewportHeight';
import { storageService } from '@/lib/storageService';
import { aiService, SentimentAnalysisResult, PatternAnalysisResult, TrendAnalysisResult } from '@/lib/aiService';
import { JournalEntry } from '@/lib/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Heart, Brain, BarChart3, Loader2 } from 'lucide-react';

interface AnalysisResult {
  sentiment: SentimentAnalysisResult;
  patterns: PatternAnalysisResult;
  trends: TrendAnalysisResult;
}

export default function InsightsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('insights');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasAnalyzedRef = useRef(false);
  const analysisInProgressRef = useRef(false);
  
  // Fix viewport height for mobile devices
  useViewportHeight();

  useEffect(() => {
    const loadData = async () => {
      try {
        await storageService.initialize();
        const loadedEntries = await storageService.getAllJournalEntries();
        setEntries(loadedEntries);
        
        // Only run analysis if we haven't already analyzed, have entries, and no analysis is in progress
        if (!hasAnalyzedRef.current && !analysisInProgressRef.current && loadedEntries.length > 0) {
          hasAnalyzedRef.current = true;
          analysisInProgressRef.current = true;
          await runAnalysis(loadedEntries);
          analysisInProgressRef.current = false;
        }
      } catch (error) {
        console.error('Failed to load journal entries:', error);
        analysisInProgressRef.current = false;
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runAnalysis = async (entriesToAnalyze: JournalEntry[]) => {
    if (isAnalyzing) return; // Prevent multiple simultaneous analyses
    
    setIsAnalyzing(true);
    console.log('🔄 Starting sequential analysis...');

    try {
      // Run sentiment analysis
      console.log('📊 Running sentiment analysis...');
      const sentimentResult = await aiService.analyzeEntries({
        entries: entriesToAnalyze,
        analysisType: 'sentiment'
      });
      console.log('✅ Sentiment analysis completed');

      // Run pattern analysis
      console.log('🔍 Running pattern analysis...');
      const patternsResult = await aiService.analyzeEntries({
        entries: entriesToAnalyze,
        analysisType: 'patterns'
      });
      console.log('✅ Pattern analysis completed');

      // Run trend analysis
      console.log('📈 Running trend analysis...');
      const trendsResult = await aiService.analyzeEntries({
        entries: entriesToAnalyze,
        analysisType: 'trends'
      });
      console.log('✅ Trend analysis completed');

      setAnalysisResults({
        sentiment: sentimentResult as SentimentAnalysisResult,
        patterns: patternsResult as PatternAnalysisResult,
        trends: trendsResult as TrendAnalysisResult
      });

      console.log('🎉 All analyses completed');
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // Navigate to the appropriate page
    switch (tabId) {
      case 'home':
        router.push('/');
        break;
      case 'chat':
        router.push('/chat');
        break;
      case 'insights':
        router.push('/insights');
        break;
      case 'history':
        router.push('/history');
        break;
      case 'settings':
        router.push('/settings');
        break;
      default:
        console.log('Unknown tab:', tabId);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Insights</h1>
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-purple-500" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-6 pb-20">
        {entries.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Journal Entries Yet</h3>
            <p className="text-gray-600 mb-4">Start journaling to see your insights and patterns.</p>
            <button
              onClick={() => router.push('/chat')}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Start Journaling
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Analysis Status */}
            {isAnalyzing && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-gray-700">Analyzing your journal entries...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sentiment Analysis */}
            {analysisResults?.sentiment && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    <span>Sentiment Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                      <Badge className={getSentimentColor(analysisResults.sentiment.data.overallSentiment)}>
                        {analysisResults.sentiment.data.overallSentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Sentiment Score</span>
                      <span className="text-sm text-gray-600">
                        {analysisResults.sentiment.data.sentimentScore?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pattern Analysis */}
            {analysisResults?.patterns && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <span>Pattern Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResults.patterns.data.patterns?.slice(0, 5).map((pattern, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{pattern.name}</span>
                        <Badge variant="secondary">{pattern.frequency}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trend Analysis */}
            {analysisResults?.trends && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span>Trend Analysis</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Total Entries</span>
                      <span className="text-sm text-gray-600">{entries.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Average Entries/Week</span>
                      <span className="text-sm text-gray-600">
                        {analysisResults.trends.data.consistency.averageEntriesPerWeek?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Most Active Day</span>
                      <span className="text-sm text-gray-600">
                        {analysisResults.trends.data.consistency.mostActiveDay || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Writing Streak</span>
                      <span className="text-sm text-gray-600">
                        {analysisResults.trends.data.consistency.writingStreak || 0} days
                      </span>
                    </div>
                    {analysisResults.trends.data.emojiUsage?.[0] && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Most Used Emoji</span>
                        <span className="text-sm text-gray-600">
                          {analysisResults.trends.data.emojiUsage[0].emoji} ({analysisResults.trends.data.emojiUsage[0].count})
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  <span>Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Based on your {entries.length} journal entries, we&apos;ve analyzed your writing patterns, 
                  emotional trends, and recurring themes to help you better understand your thoughts and feelings.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
