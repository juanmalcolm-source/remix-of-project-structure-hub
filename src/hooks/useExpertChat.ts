import { useState, useCallback, useRef } from 'react';
import {
  type ExpertType,
  type ChatMessage,
  streamExpertChat,
  buildExpertContext,
  EXPERT_CONFIGS,
} from '@/services/expertChatService';

const MAX_MESSAGES = 20;

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useExpertChat(projectId: string, expertType: ExpertType) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contextCacheRef = useRef<string | null>(null);

  const loadContext = useCallback(async () => {
    if (!contextCacheRef.current) {
      contextCacheRef.current = await buildExpertContext(projectId, expertType);
    }
    return contextCacheRef.current;
  }, [projectId, expertType]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setError(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => {
      const updated = [...prev, userMsg];
      // Trim to keep conversation manageable
      if (updated.length > MAX_MESSAGES) {
        return [updated[0], ...updated.slice(-(MAX_MESSAGES - 2))];
      }
      return updated;
    });

    // Start streaming
    setIsStreaming(true);
    setStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const context = await loadContext();

      // Build messages for API (include greeting as first assistant message for context)
      const config = EXPERT_CONFIGS[expertType];
      const apiMessages: ChatMessage[] = [
        { id: 'greeting', role: 'assistant', content: config.greeting, timestamp: new Date() },
        ...messages,
        userMsg,
      ];

      // Trim API messages too
      const trimmedApiMessages = apiMessages.length > MAX_MESSAGES
        ? [apiMessages[0], ...apiMessages.slice(-(MAX_MESSAGES - 2))]
        : apiMessages;

      let accumulated = '';
      const fullText = await streamExpertChat({
        expertType,
        messages: trimmedApiMessages,
        projectContext: context,
        onDelta: (delta) => {
          accumulated += delta;
          setStreamingText(accumulated);
        },
        signal: controller.signal,
      });

      // Add assistant response
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: fullText,
        timestamp: new Date(),
      };

      setMessages(prev => {
        const updated = [...prev, assistantMsg];
        if (updated.length > MAX_MESSAGES) {
          return [updated[0], ...updated.slice(-(MAX_MESSAGES - 2))];
        }
        return updated;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Stream was cancelled — save partial response if any
        if (streamingText) {
          const partialMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: streamingText + '\n\n*[Respuesta cancelada]*',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, partialMsg]);
        }
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        console.error('[ExpertChat] Error:', err);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText('');
      abortControllerRef.current = null;
    }
  }, [isStreaming, messages, expertType, loadContext, streamingText]);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setStreamingText('');
    setError(null);
  }, []);

  // Invalidate context cache (e.g. when data changes)
  const refreshContext = useCallback(() => {
    contextCacheRef.current = null;
  }, []);

  return {
    messages,
    isStreaming,
    streamingText,
    error,
    sendMessage,
    cancelStream,
    clearHistory,
    refreshContext,
  };
}
