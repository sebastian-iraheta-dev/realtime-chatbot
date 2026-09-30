'use client';

import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { InputMode } from '@/hooks/useRealtimeChat';

interface MicrophoneButtonProps {
  isRecording: boolean;
  isMuted?: boolean;
  inputMode?: InputMode;
  onToggle?: () => void;
  onPushToTalkStart?: () => void;
  onPushToTalkEnd?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MicrophoneButton({
  isRecording,
  isMuted = true,
  inputMode = 'push-to-talk',
  onToggle,
  onPushToTalkStart,
  onPushToTalkEnd,
  disabled = false,
  className,
}: MicrophoneButtonProps) {
  const isPushToTalk = inputMode === 'push-to-talk';

  // For push-to-talk mode
  if (isPushToTalk) {
    return (
      <Button
        variant={isRecording ? 'destructive' : 'outline'}
        size='icon-sm'
        className={cn('rounded-full', isRecording && 'animate-pulse', className)}
        onMouseDown={(e) => {
          e.preventDefault();
          onPushToTalkStart?.();
        }}
        onMouseUp={() => onPushToTalkEnd?.()}
        onMouseLeave={() => {
          if (isRecording) onPushToTalkEnd?.();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          onPushToTalkStart?.();
        }}
        onTouchEnd={() => onPushToTalkEnd?.()}
        disabled={disabled}
        aria-label={isRecording ? 'Recording...' : 'Hold to talk'}
      >
        {isRecording ? <MicOff /> : <Mic />}
      </Button>
    );
  }

  // For always-on mode (toggle mute)
  return (
    <Button
      variant={isMuted ? 'outline' : 'destructive'}
      size='icon-sm'
      className={cn('rounded-full', !isMuted && 'animate-pulse', className)}
      onClick={onToggle}
      disabled={disabled}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}
