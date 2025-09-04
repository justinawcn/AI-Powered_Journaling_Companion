'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
  emojis?: string[];
}

interface ChatInterfaceProps {
  onSaveEntry?: (entry: { text: string; emojis: string[]; timestamp: Date }) => void;
}

export interface ChatInterfaceRef {
  addMessage: (content: string) => void;
}

const ChatInterface = forwardRef<ChatInterfaceRef, ChatInterfaceProps>(({ onSaveEntry }, ref) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hi there! I'm your journal companion. How are you feeling today?",
      timestamp: new Date(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useImperativeHandle(ref, () => ({
    addMessage,
  }));

  const addMessage = (content: string, type: 'user' | 'ai' = 'user') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      emojis: type === 'user' ? extractEmojis(content) : undefined,
    };
  
    setMessages(prev => [...prev, newMessage]);
    
    // AUTO-SAVE USER MESSAGES
    if (type === 'user') {
      // Automatically save user messages to database
      saveUserMessageToDatabase(content, extractEmojis(content));
    }
    
    if (type === 'user') {
      setIsTyping(true);
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = generateAIResponse(content);
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponse,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };
  
  // Add this new method to ChatInterface:
  const saveUserMessageToDatabase = async (content: string, emojis: string[]) => {
    try {
      // Import storageService dynamically
      const { storageService } = await import('@/lib/storageService');
      
      await storageService.saveJournalEntry(content, emojis);
      console.log('✅ Message auto-saved to database');
    } catch (error) {
      console.error('❌ Failed to auto-save message:', error);
    }
  };

  const extractEmojis = (text: string): string[] => {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    return text.match(emojiRegex) || [];
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "That's interesting! Can you tell me more about how that made you feel?",
      "I appreciate you sharing that with me. What would you like to explore further?",
      "Thank you for opening up. How do you think this experience might help you grow?",
      "I hear you. What's one small thing you could do to take care of yourself right now?",
      "That sounds meaningful. What's something you're grateful for in this moment?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };


  const handleSaveEntry = () => {
    const lastUserMessage = messages
      .filter(m => m.type === 'user')
      .pop();
    
    if (lastUserMessage && onSaveEntry) {
      onSaveEntry({
        text: lastUserMessage.content,
        emojis: lastUserMessage.emojis || [],
        timestamp: lastUserMessage.timestamp,
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white shadow-sm flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Your Journal Companion</h1>
            <p className="text-sm text-gray-500">New conversation</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              {message.type === 'ai' && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/ai-avatar.png" />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                    AI
                  </AvatarFallback>
                </Avatar>
              )}
              <div className={`rounded-2xl px-4 py-3 ${
                message.type === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm">{message.content}</p>
                {message.emojis && message.emojis.length > 0 && (
                  <div className="flex space-x-1 mt-2">
                    {message.emojis.map((emoji, index) => (
                      <span key={index} className="text-lg">{emoji}</span>
                    ))}
                  </div>
                )}
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
