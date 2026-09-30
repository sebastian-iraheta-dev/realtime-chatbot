import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Bot } from 'lucide-react';

import { cn } from '@/lib/utils';

const messageAiBubbleVariants = cva('flex gap-3 w-full', {
  variants: {
    variant: {
      default: '',
      minimal: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface MessageAiBubbleProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageAiBubbleVariants> {
  message: string;
  showAvatar?: boolean;
}

function MessageAiBubble({
  className,
  variant,
  message,
  showAvatar = true,
  ...props
}: MessageAiBubbleProps) {
  return (
    <div
      data-slot='message-ai-bubble'
      className={cn(messageAiBubbleVariants({ variant, className }))}
      {...props}
    >
      {showAvatar && (
        <div className='flex size-8 shrink-0 items-center justify-center rounded-full bg-muted border'>
          <Bot className='size-4 text-muted-foreground' />
        </div>
      )}
      <div className='flex flex-col gap-1 max-w-[80%]'>
        <div className='rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm text-foreground'>
          {message}
        </div>
      </div>
    </div>
  );
}

export { MessageAiBubble, messageAiBubbleVariants };
