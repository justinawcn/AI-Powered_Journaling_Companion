'use client';

import React, { useState } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import BottomNavigation from '@/components/navigation/BottomNavigation';

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState('chat');

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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pb-20"> {/* Add bottom padding to account for fixed navigation */}
        <ChatInterface onSaveEntry={handleSaveEntry} />
      </div>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
