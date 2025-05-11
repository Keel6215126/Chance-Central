
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Use direct relative import
import { AdminBar } from '@/components/admin-bar';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { AdminModeProvider } from '@/context/admin-mode-context';
// Removed: import { AiAssistantBubble } from '@/components/ai-assistant/ai-assistant-bubble';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Use a variable for easy access in globals.css if needed
});

export const metadata: Metadata = {
  title: 'Chance Central - Interactive Probability Games',
  description: 'Explore probability with interactive games and simulators like Dice Roll, Coin Flip, Roulette, and more. Understand randomness and chance in a fun way!',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AdminModeProvider>
          <ThemeProvider defaultTheme="default" storageKey="chance-central-theme">
            <AdminBar />
            <main className="pt-[60px] p-4 md:p-8 min-h-screen bg-background text-foreground">
              {children}
            </main>
            {/* Removed: <AiAssistantBubble /> */}
            <Toaster />
          </ThemeProvider>
        </AdminModeProvider>
      </body>
    </html>
  );
}

