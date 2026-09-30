'use client';

import { cn } from '@/lib/utils';

interface LiveTranscriptProps {
  transcript: string;
  className?: string;
}

export function LiveTranscript({ transcript, className }: LiveTranscriptProps) {
  if (!transcript) return null;

  return (
    <div
      className={cn(
        'px-4 py-3 bg-muted/50 rounded-lg border border-dashed text-sm text-muted-foreground italic',
        className,
      )}
    >
      {transcript}
    </div>
  );
}
