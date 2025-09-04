'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { 
  Calendar, 
  Search, 
  Filter,
  Heart,
  Clock,
  Tag,
  Smile
} from 'lucide-react';
import { storageService } from '@/lib/storageService';
import { JournalEntry } from '@/lib/database';
import { useViewportHeight } from '@/lib/useViewportHeight';

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('history');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');

  // Fix viewport height for mobile devices
  useViewportHeight();

  useEffect(() => {
    const loadEntries = async () => {
      try {
        await storageService.initialize();
        const loadedEntries = await storageService.getAllJournalEntries();
        
        // Check if we have encrypted entries that need password
        const hasEncryptedEntries = loadedEntries.some(entry => 
          entry.encrypted && typeof entry.content !== 'string'
        );
        
        if (hasEncryptedEntries) {
          setNeedsPassword(true);
        } else {
          setEntries(loadedEntries);
          setFilteredEntries(loadedEntries);
        }
      } catch (error) {
        console.error('Failed to load journal entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;
    
    try {
      setIsLoading(true);
      await storageService.initialize(password);
      const loadedEntries = await storageService.getAllJournalEntries();
      setEntries(loadedEntries);
      setFilteredEntries(loadedEntries);
      setNeedsPassword(false);
      setPassword('');
    } catch (error) {
      console.error('Failed to decrypt entries:', error);
      alert('Invalid password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = entries;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(entry => {
        const content = typeof entry.content === 'string' ? entry.content : '';
        return content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      });
    }

    // Filter by date
    if (selectedDate) {
      const filterDate = new Date(selectedDate);
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.toDateString() === filterDate.toDateString();
      });
    }

    // Filter by mood
    if (selectedMood) {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }

    setFilteredEntries(filtered);
  }, [entries, searchQuery, selectedDate, selectedMood]);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getMoodEmoji = (mood?: string): string => {
    const moodEmojis: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      excited: '🤩',
      calm: '😌',
      anxious: '😰',
      grateful: '🙏',
      confused: '😕',
      proud: '😎',
      tired: '😴',
      energetic: '⚡',
    };
    return moodEmojis[mood || ''] || '😐';
  };

  const getUniqueMoods = (): string[] => {
    const moods = entries
      .map(entry => entry.mood)
      .filter((mood): mood is string => mood !== undefined && mood !== '');
    return Array.from(new Set(moods));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setSelectedMood('');
  };

  if (needsPassword) {
    return (
      <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Enter Password</h2>
              <p className="text-gray-600">Your journal entries are encrypted. Please enter your password to view them.</p>
            </div>
            
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="w-full"
              />
              
              <Button 
                onClick={handlePasswordSubmit}
                disabled={!password.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? 'Decrypting...' : 'Decrypt Entries'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Calendar className="w-8 h-8 animate-pulse mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading journal entries...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix bg-gray-50">
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h1 className="text-xl font-semibold text-gray-900">Journal History</h1>
          <p className="text-sm text-gray-500">{filteredEntries.length} of {entries.length} entries</p>
        </div>

        {/* Filters */}
        <div className="bg-white border-b border-gray-200 p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Date and Mood Filters */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex-1">
              <select
                value={selectedMood}
                onChange={(e) => setSelectedMood(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Moods</option>
                {getUniqueMoods().map(mood => (
                  <option key={mood} value={mood}>
                    {getMoodEmoji(mood)} {mood}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Entries List */}
        <div className="p-4 space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
              <p className="text-gray-500">
                {entries.length === 0 
                  ? "Start journaling to see your entries here"
                  : "Try adjusting your search or filters"
                }
              </p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg p-4 border border-gray-200">
                {/* Entry Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  {entry.mood && (
                    <Badge variant="secondary" className="text-xs">
                      {getMoodEmoji(entry.mood)} {entry.mood}
                    </Badge>
                  )}
                </div>

                {/* Entry Content */}
                <div className="mb-3">
                  <p className="text-gray-900 leading-relaxed">
                    {typeof entry.content === 'string' ? entry.content : '[Unable to decrypt entry]'}
                  </p>
                </div>

                {/* Emojis */}
                {entry.emojis && entry.emojis.length > 0 && (
                  <div className="flex items-center space-x-1 mb-3">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <div className="flex space-x-1">
                      {entry.emojis.map((emoji, index) => (
                        <span key={index} className="text-lg">{emoji}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
