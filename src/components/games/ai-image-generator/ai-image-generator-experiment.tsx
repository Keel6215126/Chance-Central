
'use client';

import type { FormEvent } from 'react';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { generateImage, type GenerateImageInput, type GenerateImageOutput } from '@/ai/flows/generate-image-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AiImageGeneratorExperiment() {
  const [prompt, setPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerateImage = async (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null); // Clear previous image

    const imageInput: GenerateImageInput = { prompt: trimmedPrompt };

    try {
      const output: GenerateImageOutput = await generateImage(imageInput);
      if (output.imageUrl) {
        setGeneratedImageUrl(output.imageUrl);
        toast({
          title: "Image Generated!",
          description: "Your image has been successfully created.",
        });
      } else {
        setError(output.error || "Image generation failed to return an image URL.");
        toast({
          variant: "destructive",
          title: "Image Generation Error",
          description: output.error || "An unknown error occurred while generating the image.",
        });
      }
    } catch (err: any) {
      console.error("Error calling AI Image Generation flow:", err);
      const errorMessage = err.message || "Failed to generate image. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "AI Image Generation Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
      promptInputRef.current?.focus();
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card border-border">
      <CardHeader className="py-4 px-6 border-b border-border">
        <CardTitle className="text-xl font-semibold text-card-foreground">Create Images with AI</CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter a prompt and let the AI generate an image for you. Powered by Gemini 2.0.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleGenerateImage}>
        <CardContent className="p-6 space-y-4">
          <div>
            <label htmlFor="image-prompt" className="block text-sm font-medium text-foreground mb-1">
              Image Prompt
            </label>
            <Textarea
              id="image-prompt"
              ref={promptInputRef}
              placeholder="e.g., A futuristic cityscape at sunset, vibrant colors, detailed"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px] bg-input text-foreground border-border focus:ring-ring"
              required
              rows={3}
            />
          </div>

          {isLoading && (
            <div className="flex items-center justify-center p-4 rounded-md bg-secondary text-secondary-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating your image... this might take a moment.
            </div>
          )}

          {error && !isLoading && (
            <div className="flex items-center p-3 rounded-md bg-destructive text-destructive-foreground">
              <AlertCircle className="mr-2 h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {generatedImageUrl && !isLoading && (
            <div className="mt-4 p-2 border border-border rounded-lg bg-muted aspect-square w-full max-w-md mx-auto relative overflow-hidden">
               <Image
                  src={generatedImageUrl}
                  alt={prompt || "Generated AI Image"}
                  layout="fill"
                  objectFit="contain"
                  className="rounded-md"
                  data-ai-hint={prompt.split(' ').slice(0,2).join(' ') || "abstract art"}
                />
            </div>
          )}
          {!generatedImageUrl && !isLoading && !error && (
             <div className="mt-4 p-2 border border-dashed border-border rounded-lg bg-muted aspect-square w-full max-w-md mx-auto flex flex-col items-center justify-center text-muted-foreground">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <p className="text-sm">Your generated image will appear here.</p>
            </div>
          )}

        </CardContent>
        <CardFooter className="p-6 border-t border-border bg-card rounded-b-lg">
          <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate Image"
            )}
            <span className="sr-only">Generate Image</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
