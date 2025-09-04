'use client';

import React, { useState, useRef } from 'react';
import ChatInterface, { ChatInterfaceRef } from '@/components/chat/ChatInterface';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Mic } from 'lucide-react';
import { useViewportHeight } from '@/lib/useViewportHeight';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);
  
  // Fix viewport height for mobile devices
  useViewportHeight();

  const handleSaveEntry = (entry: { text: string; emojis: string[]; timestamp: Date }) => {
    console.log('Saving entry:', entry);
    // TODO: Implement entry saving logic
    // This will be connected to the local storage system later
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
