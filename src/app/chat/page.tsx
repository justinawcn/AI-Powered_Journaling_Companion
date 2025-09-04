'use client';

import React, { useState, useRef, useEffect } from 'react';
import ChatInterface, { ChatInterfaceRef } from '@/components/chat/ChatInterface';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic } from 'lucide-react';
import { useViewportHeight } from '@/lib/useViewportHeight';
import { storageService } from '@/lib/storageService';
import { JournalEntry } from '@/lib/database';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionEntries, setSessionEntries] = useState<JournalEntry[]>([]);
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

  // Inactivity timer - save session after 5 minutes of inactivity
  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      inactivityTimerRef.current = setTimeout(async () => {
        if (currentSessionId && sessionEntries.length > 0) {
          try {
            await storageService.saveChatSession(sessionEntries, currentSessionId);
            console.log(`Session ${currentSessionId} saved due to inactivity`);
          } catch (error) {
            console.error('Failed to save session on inactivity:', error);
          }
        }
      }, 5 * 60 * 1000); // 5 minutes
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

  const saveCurrentSession = async () => {
    if (currentSessionId && sessionEntries.length > 0) {
      try {
        await storageService.saveChatSession(sessionEntries, currentSessionId);
        console.log(`✅ Session ${currentSessionId} saved with ${sessionEntries.length} entries`);
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    }
  };

  const handleSaveEntry = async (entry: { text: string; emojis: string[]; timestamp: Date }) => {
    if (!isStorageInitialized) {
      console.warn('Storage not initialized yet');
      return;
    }

    try {
      const savedEntry = await storageService.saveJournalEntry(
        entry.text,
        entry.emojis
      );
      console.log('✅ Entry saved automatically:', savedEntry.id);
      
      // Add entry to current session
      const updatedEntries = [...sessionEntries, savedEntry];
      setSessionEntries(updatedEntries);
      
      // Save session immediately after adding entry
      if (currentSessionId) {
        try {
          await storageService.saveChatSession(updatedEntries, currentSessionId);
          console.log(`✅ Session ${currentSessionId} updated with new entry`);
        } catch (error) {
          console.error('Failed to update session:', error);
        }
      }
      
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
    // TODO: Implement navigation between tabs
    console.log('Navigating to:', tabId);
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
      <div className="h-full pb-32 overflow-hidden">
        <ChatInterface ref={chatInterfaceRef} onSaveEntry={handleSaveEntry} />
      </div>
      
      {/* Input Area - fixed position above bottom navigation */}
      <div className="fixed bottom-16 mobile-input-fix tablet-input-fix left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
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
