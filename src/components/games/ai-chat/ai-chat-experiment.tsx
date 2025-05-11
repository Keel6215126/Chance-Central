
'use client';

import type { FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizonal, Loader2, AlertCircle } from 'lucide-react';
import { aiChat, type AIChatInput, type AIChatOutput } from '@/ai/flows/ai-chat-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function AIChatExperiment() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting message
  useEffect(() => {
    setMessages([{ id: crypto.randomUUID(), role: 'model', text: "Hello! I'm Keel. How can I help you today?" }]);
  }, []);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);


  const handleSendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const newUserMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: trimmedInput };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    const chatHistoryForApi = messages
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
    
    const chatInput: AIChatInput = { 
        userInput: trimmedInput,
        chatHistory: chatHistoryForApi
    };

    try {
      const output: AIChatOutput = await aiChat(chatInput);
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        role: 'model', 
        text: output.aiResponse,
      }]);
    } catch (err: any) {
      console.error("Error calling AI Chat flow:", err);
      const errorMessage = err.message || "Failed to get response from the AI. Please try again.";
      setError(errorMessage);
      setMessages(prev => [...prev, { 
        id: crypto.randomUUID(), 
        role: 'model', 
        text: "I'm having trouble connecting right now. Please try again in a moment." 
      }]);
      toast({
        variant: "destructive",
        title: "AI Chat Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto h-[70vh] max-h-[700px] shadow-xl flex flex-col bg-card border-border">
      <CardHeader className="py-3 px-4 border-b border-border">
        <CardTitle className="text-lg font-semibold text-card-foreground">Chat with Keel</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "p-2.5 rounded-lg max-w-[85%] text-sm leading-relaxed shadow",
                  msg.role === 'user'
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                    : "mr-auto bg-secondary text-secondary-foreground rounded-bl-none"
                )}
              >
                {msg.text.split('\n').map((line, index, array) => (
                    <span key={index}>
                        {line}
                        {index < array.length - 1 && <br/>}
                    </span>
                ))}
              </div>
            ))}
            {isLoading && (
               <div className="mr-auto bg-secondary text-secondary-foreground rounded-lg p-2.5 shadow inline-flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Thinking...
               </div>
            )}
            {error && (
              <div className="mr-auto bg-destructive text-destructive-foreground rounded-lg p-2.5 shadow inline-flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" /> {error}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-3 border-t border-border bg-card rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-grow bg-input text-foreground border-border focus:ring-ring"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 h-9 w-9">
            {isLoading && inputValue ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal size={18} />}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
