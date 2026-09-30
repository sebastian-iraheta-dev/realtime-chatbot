import { MessageAiBubble } from '@/components/messageBubbles/messageAiBubble';
import { MessageBubble } from '@/components/messageBubbles/messageBubble';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className='h-full gap-y-5 flex-col flex overflow-y-auto pr-2'>
      {messages.map((message) =>
        message.role === 'assistant' ? (
          <MessageAiBubble key={message.id} message={message.content} />
        ) : (
          <MessageBubble key={message.id} message={message.content} />
        ),
      )}
    </div>
  );
}
