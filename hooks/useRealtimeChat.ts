'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioPlayer, AudioRecorder, generateUUID } from '@/lib/audio-utils';
import type { Message } from '@/components/chat';

// ─── Configuration (from environment variables) ─────────────────
const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || 'https://api.grok-tutor.staging.dev-goes.com';
const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_TOKEN || '';

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'recording';

export type InputMode = 'push-to-talk' | 'always-on';

interface UseRealtimeChatOptions {
  onError?: (error: string) => void;
}

export function useRealtimeChat(options: UseRealtimeChatOptions = {}) {
  const { onError } = options;

  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [inputMode, setInputMode] = useState<InputMode>('push-to-talk');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const conversationIdRef = useRef<string>(generateUUID());
  const isResponseInProgressRef = useRef(false);
  const currentTranscriptRef = useRef('');

  // Helpers
  const showError = useCallback(
    (msg: string) => {
      setError(msg);
      onError?.(msg);
      setTimeout(() => setError(null), 5000);
    },
    [onError],
  );

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: generateUUID(),
      content,
      role,
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  // WebSocket message handler
  const handleServerMessage = useCallback(
    (data: Record<string, unknown>) => {
      const type = data.type as string;

      switch (type) {
        case 'session.created':
        case 'session.updated':
          console.log(`[${type}]`, data);
          break;

        case 'conversation.created':
          console.log('Conversation created:', data);
          break;

        case 'input_audio_buffer.speech_started':
          console.log('🎤 User started speaking (server VAD detected)');

          // *** INTERRUPTION HANDLING ***
          // Server detected user speech - stop playback immediately
          if (audioPlayerRef.current) {
            audioPlayerRef.current.stop();
          }

          // Clear live transcript if assistant was speaking
          if (isResponseInProgressRef.current) {
            currentTranscriptRef.current = '';
            setLiveTranscript('');
          }

          setStatus('listening');
          break;

        case 'input_audio_buffer.speech_stopped':
          setStatus('processing');
          break;

        case 'conversation.item.added': {
          // Handle user transcript from conversation.item.added
          const item = data.item as Record<string, unknown> | undefined;
          if (item?.role === 'user' && Array.isArray(item.content)) {
            for (const content of item.content) {
              if (content.type === 'input_audio' && content.transcript) {
                addMessage('user', content.transcript as string);
                break;
              }
            }
          }
          break;
        }

        case 'response.created':
          isResponseInProgressRef.current = true;
          currentTranscriptRef.current = '';
          setStatus('speaking');
          break;

        case 'response.output_audio_transcript.delta':
          currentTranscriptRef.current += (data.delta as string) || '';
          setLiveTranscript(currentTranscriptRef.current);
          break;

        case 'response.output_audio_transcript.done':
          if (currentTranscriptRef.current) {
            addMessage('assistant', currentTranscriptRef.current);
          }
          currentTranscriptRef.current = '';
          setLiveTranscript('');
          break;

        case 'response.output_audio.delta':
          if (data.delta && audioPlayerRef.current) {
            audioPlayerRef.current.addAudio(data.delta as string);
          }
          break;

        case 'response.done':
          isResponseInProgressRef.current = false;
          setStatus('connected');
          break;

        case 'response.cancelled':
          console.log('Response cancelled (interrupted)');
          isResponseInProgressRef.current = false;
          currentTranscriptRef.current = '';
          setLiveTranscript('');
          setStatus('connected');
          break;

        case 'error':
          console.error('[error]', data);
          showError(
            (data.error as Record<string, string>)?.message || 'Server error',
          );
          break;

        default:
          console.log(`[${type}]`, data);
      }
    },
    [addMessage, showError],
  );

  // Start recording
  const startRecording = useCallback(async () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (audioRecorderRef.current) return;

    try {
      const recorder = new AudioRecorder();
      audioRecorderRef.current = recorder;

      await recorder.start((base64Audio) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: base64Audio,
            }),
          );
        }
      });

      setIsRecording(true);
      setStatus('recording');
    } catch (err) {
      console.error('Mic error:', err);
      showError('Could not access microphone');
    }
  }, [showError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    setIsRecording(false);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setStatus('connected');
    }
  }, []);

  // Cleanup function (used by both endCall and ws.onclose)
  const cleanup = useCallback(() => {
    stopRecording();
    wsRef.current = null;
    audioPlayerRef.current?.close();
    audioPlayerRef.current = null;
    setStatus('disconnected');
    setIsMuted(true);
    setIsRecording(false);
  }, [stopRecording]);

  // Start call
  const startCall = useCallback(async () => {
    try {
      if (!AUTH_TOKEN) {
        showError('Missing NEXT_PUBLIC_AUTH_TOKEN in .env.local');
        return;
      }

      setStatus('connecting');
      setError(null);

      // Generate a new conversation ID for each call
      conversationIdRef.current = generateUUID();

      const token = encodeURIComponent(AUTH_TOKEN.replace('Bearer ', ''));
      const wsUrl = `${PROXY_URL.replace('https:', 'wss:').replace('http:', 'ws:')}/api/v1/realtime/proxy?conversation_id=${conversationIdRef.current}&token=${token}`;
      console.log('Connecting to proxy:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to proxy');
        setStatus('connected');
        audioPlayerRef.current = new AudioPlayer();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);
          handleServerMessage(data);
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        showError('Connection error - check console for details');
        setStatus('disconnected');
      };

      ws.onclose = (event) => {
        console.log(
          `WebSocket closed — code: ${event.code}, reason: "${event.reason}", clean: ${event.wasClean}`,
        );
        // Only show error if it wasn't a clean close and we were connecting
        if (!event.wasClean && event.code !== 1000) {
          showError(`Connection closed: ${event.reason || 'Unknown reason'} (code: ${event.code})`);
        }
        cleanup();
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      showError(err instanceof Error ? err.message : 'Failed to connect');
      setStatus('disconnected');
    }
  }, [handleServerMessage, showError, cleanup]);

  // End call
  const endCall = useCallback(() => {
    wsRef.current?.close();
    cleanup();
  }, [cleanup]);

  // Toggle mute (for always-on mode)
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        stopRecording();
      } else {
        startRecording();
      }
      return newMuted;
    });
  }, [startRecording, stopRecording]);

  // Switch input mode
  const switchInputMode = useCallback(
    (mode: InputMode) => {
      setInputMode(mode);

      if (mode === 'push-to-talk') {
        stopRecording();
      } else {
        // Always-on mode: start with mic ON (unmuted)
        setIsMuted(false);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          startRecording();
        }
      }
    },
    [startRecording, stopRecording],
  );

  // Send text message
  const sendTextMessage = useCallback(
    (text: string) => {
      const ws = wsRef.current;
      if (!text.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

      // Send text as a conversation item
      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: text.trim(),
            },
          ],
        },
      };

      ws.send(JSON.stringify(event));

      // Request a response
      ws.send(JSON.stringify({ type: 'response.create' }));

      // Display in UI
      addMessage('user', text.trim());
    },
    [addMessage],
  );

  // Push-to-talk handlers
  const handlePushToTalkStart = useCallback(() => {
    if (inputMode === 'push-to-talk') {
      startRecording();
    }
  }, [inputMode, startRecording]);

  const handlePushToTalkEnd = useCallback(() => {
    if (inputMode === 'push-to-talk') {
      stopRecording();
    }
  }, [inputMode, stopRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      wsRef.current?.close();
      audioPlayerRef.current?.close();
    };
  }, [stopRecording]);

  return {
    // State
    messages,
    status,
    liveTranscript,
    isRecording,
    isMuted,
    inputMode,
    error,
    isConnected: status !== 'disconnected' && status !== 'connecting',

    // Actions
    startCall,
    endCall,
    startRecording,
    stopRecording,
    toggleMute,
    switchInputMode,
    sendTextMessage,
    handlePushToTalkStart,
    handlePushToTalkEnd,

    // Setters
    setMessages,
  };
}
