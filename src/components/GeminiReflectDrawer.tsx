import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  User, 
  RefreshCw, 
  MessageSquareHeart,
  Compass,
  Lightbulb
} from 'lucide-react';
import { ChatMessage, JournalEntry } from '../types';
import { streamGeminiChat } from '../lib/api';

interface GeminiReflectDrawerProps {
  entry: JournalEntry;
  onUpdateChat: (messages: ChatMessage[]) => void;
  onAnalyzeEmotionsRequest: () => void;
}

const QUICK_PROMPTS = [
  "✨ Unpack the hidden tension",
  "⚖️ Stoic reframe",
  "🌱 1 concrete micro-step",
  "💭 What is this teaching me?",
  "🕊️ Calming anchor"
];

// Helper to render bold, italic, and formatted inline text
function renderInlineFormattedText(text: string): React.ReactNode {
  // Regex to split by bold markers (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="text-amber-200 font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={index} className="text-stone-300 italic font-serif">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

// Sophisticated assistant message layout parser
const FormattedAssistantMessage: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  if (paragraphs.length === 0) {
    return <p className="text-stone-200">{text}</p>;
  }

  return (
    <div className="space-y-2.5 text-[13px] leading-relaxed text-stone-200">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();

        // Check if paragraph is an anchor question callout
        const isAnchorQuestion = 
          trimmed.startsWith('>') || 
          trimmed.toLowerCase().includes('anchor question:') || 
          (trimmed.endsWith('?') && trimmed.length < 120 && pIdx === paragraphs.length - 1);

        if (isAnchorQuestion) {
          const cleanText = trimmed
            .replace(/^>\s*/, '')
            .replace(/^\*\*Anchor Question:?\*\*\s*/i, '')
            .replace(/^Anchor Question:?\s*/i, '')
            .trim();

          return (
            <div 
              key={pIdx} 
              className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-stone-900/40 border-l-2 border-amber-400 text-stone-100 shadow-sm"
            >
              <div className="flex items-start space-x-2">
                <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block mb-0.5">
                    Anchor Question
                  </span>
                  <p className="font-serif italic text-stone-200 text-[12.5px] leading-snug">
                    {renderInlineFormattedText(cleanText)}
                  </p>
                </div>
              </div>
            </div>
          );
        }

        // Check if bullet list
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
          const items = trimmed.split(/\n/).filter(i => i.trim());
          return (
            <ul key={pIdx} className="space-y-1.5 pl-1 my-1">
              {items.map((item, iIdx) => {
                const itemText = item.replace(/^[-•*]\s*/, '').trim();
                return (
                  <li key={iIdx} className="flex items-start space-x-2 text-[12.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <span>{renderInlineFormattedText(itemText)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard text paragraph
        return (
          <p key={pIdx} className="text-stone-200">
            {renderInlineFormattedText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const GeminiReflectDrawer: React.FC<GeminiReflectDrawerProps> = ({
  entry,
  onUpdateChat,
  onAnalyzeEmotionsRequest
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [entry.chatMessages, isLoading, streamingText]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputText).trim();
    if (!messageContent || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      text: messageContent,
      timestamp: Date.now()
    };

    const updatedMessages = [...(entry.chatMessages || []), userMsg];
    onUpdateChat(updatedMessages);
    setInputText('');
    setIsLoading(true);
    setStreamingText('');

    try {
      let accumulated = '';
      const reply = await streamGeminiChat(
        updatedMessages,
        entry.content || '',
        entry.mood,
        entry.location?.name,
        entry.photos?.length,
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        }
      );

      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        text: reply || accumulated,
        timestamp: Date.now()
      };

      onUpdateChat([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        text: "Your words carry a quiet honesty that cuts through the noise.\n\n**Clarity begins the moment you stop rushing past your own feelings.**\n\n> **Anchor Question:** What is one expectation you can gently set down before tomorrow?",
        timestamp: Date.now()
      };
      onUpdateChat([...updatedMessages, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setStreamingText(null);
    }
  };

  const handleInitialReflect = () => {
    handleSendMessage("Read my entry and share a sharp, concise reflection with one bold insight and an anchor question.");
  };

  return (
    <div className="flex flex-col h-full bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-stone-800 bg-stone-900/90 flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 border border-amber-500/20">
            <MessageSquareHeart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-serif font-semibold text-sm text-stone-100 truncate">
              Reflection Companion
            </h3>
            <p className="text-[11px] text-stone-400 truncate">
              Concise mindfulness insights & anchor questions
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAnalyzeEmotionsRequest}
          className="shrink-0 text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl font-medium transition flex items-center space-x-1.5 whitespace-nowrap shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Analyze Emotions</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {(!entry.chatMessages || entry.chatMessages.length === 0) && !streamingText && !isLoading ? (
          <div className="text-center py-8 px-4 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-serif font-semibold text-stone-200 text-sm">
                Begin an Interactive Reflection
              </h4>
              <p className="text-xs text-stone-400 max-w-xs mx-auto mt-1 leading-relaxed">
                Receive compact philosophical insights, emotional clarity, and a piercing anchor question tailored to your entry.
              </p>
            </div>

            <button
              type="button"
              id="initial-reflect-btn"
              onClick={handleInitialReflect}
              disabled={isLoading || !entry.content.trim()}
              className="inline-flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-xl font-semibold text-xs transition shadow disabled:opacity-40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Reflect on this Entry</span>
            </button>
          </div>
        ) : (
          <>
            {entry.chatMessages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500 text-stone-950 font-medium rounded-br-none shadow-sm text-xs'
                      : 'bg-stone-900/90 text-stone-200 border border-stone-800 rounded-bl-none shadow-md'
                  }`}
                >
                  {msg.role === 'user' ? (
                    msg.text
                  ) : (
                    <FormattedAssistantMessage text={msg.text} />
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-lg bg-stone-800 text-stone-300 flex items-center justify-center shrink-0 mt-0.5 border border-stone-700">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Message Display */}
            {isLoading && (
              <div className="flex space-x-2.5 justify-start">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                </div>

                <div className="max-w-[88%] rounded-2xl px-4 py-3 leading-relaxed bg-stone-900/90 text-stone-200 border border-amber-500/30 rounded-bl-none shadow-md">
                  {streamingText ? (
                    <>
                      <FormattedAssistantMessage text={streamingText} />
                      <span className="inline-block w-1.5 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle" />
                    </>
                  ) : (
                    <div className="flex items-center space-x-2 text-stone-400 italic text-xs">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                      <span>Uncovering emotional resonance...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-2 bg-stone-950/60 border-t border-stone-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex space-x-1.5">
        {QUICK_PROMPTS.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(promptText)}
            disabled={isLoading}
            className="text-[11px] bg-stone-800/80 hover:bg-stone-800 hover:text-amber-300 border border-stone-700 text-stone-300 px-2.5 py-1 rounded-full shrink-0 transition disabled:opacity-40 shadow-xs"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <div className="p-3 bg-stone-900/90 border-t border-stone-800 flex items-center space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask for an insight, stoic reframe, or unpack a thought..."
          disabled={isLoading}
          className="flex-1 bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-stone-100 focus:outline-none transition disabled:opacity-50 placeholder:text-stone-500"
        />
        <button
          type="button"
          id="send-gemini-chat-btn"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="p-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl transition shadow disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

