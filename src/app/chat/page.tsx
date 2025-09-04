'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface, { ChatInterfaceRef } from '@/components/chat/ChatInterface';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic, Clock } from 'lucide-react';
import { useViewportHeight } from '@/lib/useViewportHeight';
import { storageService } from '@/lib/storageService';
import { JournalEntry } from '@/lib/database';

export default function ChatPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionEntries, setSessionEntries] = useState<JournalEntry[]>([]);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [hasUnsavedEntries, setHasUnsavedEntries] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fix viewport height for mobile devices
  useViewportHeight();

  // Initialize storage service and start session
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await storageService.initialize();
        setIsStorageInitialized(true);
        console.log('Storage service initialized successfully');
        
        // Start a new chat session
        const sessionId = crypto.randomUUID();
        setCurrentSessionId(sessionId);
        console.log(`Started chat session: ${sessionId}`);
      } catch (error) {
        console.error('Failed to initialize storage service:', error);
      }
    };

    initializeStorage();
  }, []);

  // Inactivity timer - save session after 2 minutes of inactivity
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      inactivityTimerRef.current = setTimeout(async () => {
        if (currentSessionId && sessionEntries.length > 0) {
          try {
            await storageService.saveChatSession(sessionEntries, currentSessionId);
            console.log(`Session ${currentSessionId} saved due to inactivity (${sessionEntries.length} entries)`);
          } catch (error) {
            console.error('Failed to save session on inactivity:', error);
          }
        }
      }, 2 * 60 * 1000); // 2 minutes
    };

    // Reset timer on user activity
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners for user activity
    document.addEventListener('click', handleUserActivity);
    document.addEventListener('keypress', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);

    // Initial timer setup
    resetInactivityTimer();

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keypress', handleUserActivity);
      document.removeEventListener('scroll', handleUserActivity);
    };
  }, [currentSessionId, sessionEntries]);

  // Page unload save - save session when user leaves the page
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (currentSessionId && sessionEntries.length > 0) {
        // Use sendBeacon for reliable saving on page unload
        const sessionData = {
          sessionId: currentSessionId,
          entryIds: sessionEntries.map(entry => entry.id),
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        };
        
        // Try to save synchronously if possible
        navigator.sendBeacon('/api/save-session', JSON.stringify(sessionData));
        
        // Also try the async save (may not complete before page unloads)
        saveCurrentSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentSessionId, sessionEntries]);

  const saveCurrentSession = async () => {
    if (currentSessionId && sessionEntries.length > 0) {
      try {
        await storageService.saveChatSession(sessionEntries, currentSessionId);
        console.log(`✅ Session ${currentSessionId} saved with ${sessionEntries.length} entry IDs (no duplicate storage)`);
        setLastSaveTime(new Date());
        setHasUnsavedEntries(false);
        return true;
      } catch (error) {
        console.error('Failed to save session:', error);
        return false;
      }
    }
    return false;
  };


  const handleEndSession = async () => {
    // Save current session first
    await saveCurrentSession();
    
    // Start new session
    const newSessionId = crypto.randomUUID();
    setCurrentSessionId(newSessionId);
    setSessionEntries([]);
    
    console.log(`🔄 Started new session: ${newSessionId}`);
    
    // You could add a toast notification here
    console.log('✅ Session ended and new session started');
  };

  const handleSaveEntry = async (entry: { text: string; emojis: string[]; timestamp: Date }) => {
    if (!isStorageInitialized) {
      console.warn('Storage not initialized yet');
      return;
    }

    try {
      // Save the entry once to the journal entries store
      const savedEntry = await storageService.saveJournalEntry(
        entry.text,
        entry.emojis
      );
      console.log('✅ Entry saved automatically:', savedEntry.id);
      
      // Add entry to current session (in memory only)
      const updatedEntries = [...sessionEntries, savedEntry];
      setSessionEntries(updatedEntries);
      setHasUnsavedEntries(true);
      
      // Note: Session will be saved automatically by the inactivity timer
      // No need to save session immediately after each entry
      
      // You could add a toast notification here
      // toast.success('Journal entry saved!');
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      // You could add an error toast here
      // toast.error('Failed to save entry. Please try again.');
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

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Send message to chat interface
    chatInterfaceRef.current?.addMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen mobile-viewport-fix tablet-viewport-fix desktop-viewport-fix bg-gray-50">
      {/* Chat Messages Area - with bottom padding for input and navigation */}
      <div className="h-full pb-24 overflow-hidden">
        <ChatInterface ref={chatInterfaceRef} onSaveEntry={handleSaveEntry} />
      </div>

      {/* Input Area - fixed position directly on top of bottom navigation */}
      <div className="fixed left-0 right-0 bg-white border-t border-gray-200 p-4 z-30" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}>
        {/* Simple status indicator */}
        {hasUnsavedEntries && (
          <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Unsaved entries ({sessionEntries.length})</span>
            </span>
            <div className="flex space-x-1">
              <button
                onClick={handleEndSession}
                className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                End
              </button>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="pr-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 text-gray-400 hover:text-gray-600"
            >
              <Mic className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="rounded-full w-12 h-12 p-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
