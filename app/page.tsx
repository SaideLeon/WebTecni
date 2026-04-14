import { ResearchAssistant } from '@/components/research-assistant';
import { Toaster } from 'sonner';

export default function Home() {
  return (
    <main className="min-h-screen">
      <ResearchAssistant />
      <Toaster position="top-center" />
    </main>
  );
}
