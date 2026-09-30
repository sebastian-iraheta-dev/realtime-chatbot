'use client';

import { Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallButtonsProps {
  isConnected: boolean;
  isConnecting: boolean;
  onStartCall: () => void;
  onEndCall: () => void;
}

export function CallButtons({
  isConnected,
  isConnecting,
  onStartCall,
  onEndCall,
}: CallButtonsProps) {
  return (
    <div className='flex gap-2'>
      {!isConnected ? (
        <Button
          onClick={onStartCall}
          disabled={isConnecting}
          className='gap-2'
          variant='default'
        >
          <Phone className='size-4' />
          {isConnecting ? 'Connecting…' : 'Start Call'}
        </Button>
      ) : (
        <Button
          onClick={onEndCall}
          variant='destructive'
          className='gap-2'
        >
          <PhoneOff className='size-4' />
          End Call
        </Button>
      )}
    </div>
  );
}
