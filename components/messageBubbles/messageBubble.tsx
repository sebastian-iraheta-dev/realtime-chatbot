import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const messageBubbleVariants = cva('flex w-full justify-end', {
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

interface MessageBubbleProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageBubbleVariants> {
  message: string;
}

function MessageBubble({
  className,
  variant,
  message,
  ...props
}: MessageBubbleProps) {
  return (
    <div
      data-slot='message-bubble'
      className={cn(messageBubbleVariants({ variant, className }))}
      {...props}
    >
      <div className='flex flex-col gap-1 max-w-[80%]'>
        <div className='rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground'>
          {message}
        </div>
      </div>
    </div>
  );
}

export { MessageBubble, messageBubbleVariants };
