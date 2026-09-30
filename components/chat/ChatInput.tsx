'use client';

import { Textarea } from '@/components/ui/textarea';
import { MicrophoneButton } from './MicrophoneButton';
import { SendButton } from './SendButton';
import { useAutoResizeTextarea } from '@/hooks/useAutoResizeTextarea';
import type { InputMode } from '@/hooks/useRealtimeChat';

interface ChatInputProps {
  isRecording: boolean;
  isMuted?: boolean;
  inputMode?: InputMode;
  isConnected?: boolean;
  onToggleMute?: () => void;
  onPushToTalkStart?: () => void;
  onPushToTalkEnd?: () => void;
  onSendMessage?: (message: string) => void;
}

export function ChatInput({
  isRecording,
  isMuted = true,
  inputMode = 'push-to-talk',
  isConnected = false,
  onToggleMute,
  onPushToTalkStart,
  onPushToTalkEnd,
  onSendMessage,
}: ChatInputProps) {
  const { textareaRef, handleInput, resetHeight } = useAutoResizeTextarea();

  const handleSend = () => {
    const message = textareaRef.current?.value.trim();
    if (!message) return;

    onSendMessage?.(message);
    if (textareaRef.current) {
      textareaRef.current.value = '';
      resetHeight();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className='relative w-full mb-2'>
      <Textarea
        ref={textareaRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder='Type something...'
        className='w-full resize-none pr-20 overflow-y-auto min-h-11 py-2.5'
        rows={1}
      />

      <MicrophoneButton
        isRecording={isRecording}
        isMuted={isMuted}
        inputMode={inputMode}
        onToggle={onToggleMute}
        onPushToTalkStart={onPushToTalkStart}
        onPushToTalkEnd={onPushToTalkEnd}
        disabled={!isConnected}
        className='absolute right-10 bottom-1.5'
      />

      <SendButton
        onClick={handleSend}
        className='absolute right-1.5 bottom-1.5'
      />
    </div>
  );
}
