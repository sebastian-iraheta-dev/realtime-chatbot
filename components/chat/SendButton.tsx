import { ArrowUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SendButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function SendButton({ onClick, disabled, className }: SendButtonProps) {
  return (
    <Button
      variant='outline'
      size='icon-sm'
      className={cn('rounded-full', className)}
      onClick={onClick}
      disabled={disabled}
      aria-label='Send message'
    >
      <ArrowUpIcon />
    </Button>
  );
}
