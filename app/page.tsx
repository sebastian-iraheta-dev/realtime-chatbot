'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChatInput,
  MessageList,
  ConnectionStatus,
  CallButtons,
  LiveTranscript,
  ModeToggle,
} from '@/components/chat';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';

export default function Home() {
  const {
    messages,
    status,
    liveTranscript,
    isRecording,
    isMuted,
    inputMode,
    error,
    isConnected,
    startCall,
    endCall,
    toggleMute,
    switchInputMode,
    sendTextMessage,
    handlePushToTalkStart,
    handlePushToTalkEnd,
  } = useRealtimeChat();

  return (
    <div className='flex justify-center items-center h-screen w-full py-2'>
      <Card className='pb-0 h-full'>
        <CardHeader className='px-2'>
          <div className='flex items-center justify-between gap-4'>
            <CardTitle>Realtime Chatbot</CardTitle>
            <div className='flex items-center gap-3'>
              <ConnectionStatus status={status} />
              <CallButtons
                isConnected={isConnected}
                isConnecting={status === 'connecting'}
                onStartCall={startCall}
                onEndCall={endCall}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className='px-2 flex-1 overflow-hidden flex flex-col gap-3'>
          <MessageList messages={messages} />
          <LiveTranscript transcript={liveTranscript} />
        </CardContent>

        <CardFooter className='px-2 border-t bg-muted/50 rounded-b-xl flex-col gap-3'>
          {isConnected && (
            <ModeToggle
              mode={inputMode}
              onModeChange={switchInputMode}
              className='w-full justify-center py-2'
            />
          )}

          <ChatInput
            isRecording={isRecording}
            isMuted={isMuted}
            inputMode={inputMode}
            isConnected={isConnected}
            onToggleMute={toggleMute}
            onPushToTalkStart={handlePushToTalkStart}
            onPushToTalkEnd={handlePushToTalkEnd}
            onSendMessage={sendTextMessage}
          />

          {error && (
            <div className='text-sm text-destructive text-center w-full'>
              {error}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
