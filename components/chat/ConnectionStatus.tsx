'use client';

import { cn } from '@/lib/utils';
import type { ConnectionStatus as ConnectionStatusType } from '@/hooks/useRealtimeChat';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  className?: string;
}

const statusConfig: Record<
  ConnectionStatusType,
  { label: string; className: string }
> = {
  disconnected: {
    label: 'Not Connected',
    className: 'bg-gray-100 text-gray-600 border-gray-300',
  },
  connecting: {
    label: 'Connecting…',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-300 animate-pulse',
  },
  connected: {
    label: 'Connected — ready',
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  listening: {
    label: 'Listening…',
    className: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse',
  },
  processing: {
    label: 'Processing…',
    className: 'bg-purple-100 text-purple-700 border-purple-300 animate-pulse',
  },
  speaking: {
    label: 'Grok is speaking…',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-300 animate-pulse',
  },
  recording: {
    label: 'Recording…',
    className: 'bg-red-100 text-red-700 border-red-300 animate-pulse',
  },
};

export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'px-3 py-1.5 text-sm font-medium rounded-full border',
        config.className,
        className,
      )}
    >
      {config.label}
    </div>
  );
}
