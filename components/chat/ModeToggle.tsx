'use client';

import { cn } from '@/lib/utils';
import type { InputMode } from '@/hooks/useRealtimeChat';

interface ModeToggleProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  className?: string;
}

export function ModeToggle({ mode, onModeChange, className }: ModeToggleProps) {
  return (
    <div className={cn('flex gap-4 text-sm', className)}>
      <label className='flex items-center gap-2 cursor-pointer'>
        <input
          type='radio'
          name='mode'
          value='push-to-talk'
          checked={mode === 'push-to-talk'}
          onChange={() => onModeChange('push-to-talk')}
          className='accent-primary'
        />
        <span>Push to Talk</span>
      </label>
      <label className='flex items-center gap-2 cursor-pointer'>
        <input
          type='radio'
          name='mode'
          value='always-on'
          checked={mode === 'always-on'}
          onChange={() => onModeChange('always-on')}
          className='accent-primary'
        />
        <span>Always On</span>
      </label>
    </div>
  );
}
