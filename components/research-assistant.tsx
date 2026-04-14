'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, BookOpen, History, Loader2, ExternalLink, GraduationCap, Sparkles, ChevronRight, Trash2, FileText, Download, Plus, X, FileDown, Sun, Moon, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { performResearch, ResearchResult } from '@/lib/gemini';
import { toast } from 'sonner';
import { useThemeMode } from '@/hooks/use-theme-mode';
import Link from 'next/link';

interface ResearchHistoryItem {
  id: string;
  query: string;
  result: ResearchResult;
  timestamp: number;
}

interface FactSheetItem {
  id: string;
  title: string;
  content: string;
  sources: { title: string; url: string }[];
  timestamp: number;
}

export function ResearchAssistant() {
  const { themeMode, toggleThemeMode, mounted } = useThemeMode();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<ResearchResult | null>(null);
  const [activeResearchQuery, setActiveResearchQuery] = useState('');
  const [sessionResearches, setSessionResearches] = useState<{id: string, query: string, result: ResearchResult, timestamp: number}[]>([]);
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [factSheet, setFactSheet] = useState<FactSheetItem[]>([]);
  const [activeTab, setActiveTab] = useState('research');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const themeVars =
    themeMode === 'dark'
      ? '[--ink:#f9fafb] [--parchment:#0f0e0d] [--gold:#d4b37b] [--gold2:#c9a96e] [--muted:#d1d5db] [--faint:#9ca3af] [--green:#6ea886] [--teal:#61aa9d] [--border:#2c2721] [--navBg:#0f0e0d] [--heroRight:#090908]'
      : '[--ink:#111827] [--parchment:#f9fafb] [--gold:#c9a96e] [--gold2:#8b6914] [--muted:#374151] [--faint:#6b7280] [--green:#4a7c59] [--teal:#3a8a7a] [--border:#e5e7eb] [--navBg:#f5f0e8] [--heroRight:#1e1a14]';

  useEffect(() => {
    const savedHistory = localStorage.getItem('research_history');
    const savedFactSheet = localStorage.getItem('fact_sheet');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Deduplicate by ID just in case
        const unique = parsed.filter((item: any, index: number, self: any[]) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        setHistory(unique);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
    if (savedFactSheet) {
      try {
        const parsed = JSON.parse(savedFactSheet);
        const unique = parsed.filter((item: any, index: number, self: any[]) =>
          index === self.findIndex((t) => t.id === item.id)
        );
        setFactSheet(unique);
      } catch (e) {
        console.error("Failed to parse fact sheet", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('research_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('fact_sheet', JSON.stringify(factSheet));
  }, [factSheet]);

  const handleResearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setCurrentResult(null);
    setActiveTab('research');

    try {
      setIsSidebarOpen(false);
      
      // Prepare history for Gemini
      const geminiHistory = sessionResearches.map(s => ({
        query: s.query,
        answer: s.result.answer
      }));

      const result = await performResearch(query, geminiHistory);
      setCurrentResult(result);
      setActiveResearchQuery(query);
      
      const newSessionEntry = { 
        id: `sess-new-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
        query, 
        result, 
        timestamp: Date.now() 
      };
      setSessionResearches(prev => [...prev, newSessionEntry]);
      
      const newItem: ResearchHistoryItem = {
        id: `hist-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
        query,
        result,
        timestamp: Date.now(),
      };
      
      setHistory(prev => [newItem, ...prev].slice(0, 20));
      setQuery('');
    } catch (error) {
      console.error(error);
      toast.error("Erro ao realizar pesquisa. Verifique sua conexão e chave de API.");
    } finally {
      setIsLoading(false);
    }
  };

  const addToFactSheet = () => {
    if (!currentResult) return;
    
    setFactSheet(prev => {
      // Find if there's already a "Session Sheet"
      // We'll use a specific ID or just the first one if we want to keep it simple
      // The user wants a single technical sheet that is not duplicated.
      
      const sessionSheetId = "current-session-sheet";
      const existingIndex = prev.findIndex(item => item.id === sessionSheetId);
      
      const sectionTitle = activeResearchQuery || "Pesquisa";
      const sectionContent = `### ${sectionTitle}\n\n${currentResult.answer}`;
      
      if (existingIndex >= 0) {
        const existing = prev[existingIndex];
        const updatedSources = [...existing.sources, ...currentResult.sources]
          .filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);
          
        const updatedSheet = {
          ...existing,
          title: "Ficha Técnica Acumulada",
          content: `${existing.content}\n\n---\n\n${sectionContent}`,
          sources: updatedSources,
          timestamp: Date.now(),
        };
        
        const newFactSheet = [...prev];
        newFactSheet[existingIndex] = updatedSheet;
        return newFactSheet;
      } else {
        const newSheet: FactSheetItem = {
          id: sessionSheetId,
          title: "Ficha Técnica Acumulada",
          content: sectionContent,
          sources: currentResult.sources,
          timestamp: Date.now(),
        };
        return [newSheet, ...prev];
      }
    });
    
    toast.success("Adicionado à Ficha Técnica!");
  };

  const removeFromFactSheet = (id: string) => {
    setFactSheet(prev => prev.filter(item => item.id !== id));
    toast.success("Removido da Ficha Técnica.");
  };

  const exportFactSheet = () => {
    if (factSheet.length === 0) {
      toast.error("Ficha técnica vazia.");
      return;
    }

    let content = "# Ficha Técnica de Pesquisa Acadêmica\n\n";
    content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    content += "---\n\n";

    factSheet.forEach((item, index) => {
      content += `## ${index + 1}. ${item.title}\n\n`;
      content += `${item.content}\n\n`;
      if (item.sources.length > 0) {
        content += "### Fontes Consultadas:\n";
        item.sources.forEach(source => {
          content += `- [${source.title}](${source.url})\n`;
        });
      }
      content += "\n---\n\n";
    });

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha-tecnica-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Ficha técnica exportada com sucesso!");
  };

  const startNewSession = () => {
    setSessionResearches([]);
    setCurrentResult(null);
    setQuery('');
    setActiveResearchQuery('');
    toast.success("Nova sessão iniciada.");
  };

  const loadFromHistory = (item: ResearchHistoryItem) => {
    setCurrentResult(item.result);
    setQuery(item.query);
    setActiveResearchQuery(item.query);
    // When loading from history, we start a new session with just that item
    // Use a new unique ID for the session entry to avoid key conflicts in AnimatePresence
    setSessionResearches([{ 
      id: `sess-load-${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
      query: item.query, 
      result: item.result, 
      timestamp: item.timestamp 
    }]);
    setActiveTab('research');
    setIsSidebarOpen(false);
  };

  const clearHistory = () => {
    setHistory([]);
    toast.success("Histórico limpo.");
  };

  const ThemeToggle = ({ size = 12 }: { size?: number }) => (
    <button
      type="button"
      onClick={toggleThemeMode}
      className="flex items-center gap-1.5 rounded border border-[var(--border)] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] transition hover:border-[var(--gold2)] hover:text-[var(--gold2)]"
    >
      {!mounted ? (
        <div className="w-12 h-3" /> // Placeholder to prevent mismatch
      ) : themeMode === 'dark' ? (
        <><Sun size={size} /> Claro</>
      ) : (
        <><Moon size={size} /> Escuro</>
      )}
    </button>
  );

  return (
    <main className={`${mounted ? themeVars : ''} flex flex-col lg:flex-row h-screen bg-[var(--parchment)] text-[var(--ink)] font-sans overflow-hidden transition-colors duration-300 relative`}>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--parchment)] z-30">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center rounded bg-gradient-to-br from-[var(--gold)] to-[var(--gold2)] font-mono text-[10px] font-bold text-black">∂</div>
          <span className="font-serif text-lg italic text-[var(--gold2)]">Muneri</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle size={14} />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-md border border-[var(--border)] text-[var(--muted)]"
          >
            {isSidebarOpen ? <X size={20} /> : <History size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar - History & Fact Sheet Toggle */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
      
      <aside className={`
        fixed inset-0 z-40 lg:relative lg:inset-auto lg:z-auto
        w-full lg:w-80 border-r border-[var(--border)] bg-[var(--parchment)] 
        flex flex-col h-full transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 hidden lg:flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded bg-gradient-to-br from-[var(--gold)] to-[var(--gold2)] font-mono text-sm font-bold text-black">∂</div>
            <span className="font-serif text-xl italic text-[var(--gold2)]">Muneri</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={startNewSession} className="h-8 w-8 text-[var(--faint)] hover:text-[var(--gold2)]" title="Nova Sessão">
              <Plus size={16} />
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <div className="px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[var(--border)]/50 p-1 rounded-md">
              <TabsTrigger 
                value="research" 
                className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] transition-all data-[state=active]:bg-[var(--parchment)] data-[state=active]:text-[var(--gold2)] data-[state=active]:shadow-sm hover:text-[var(--ink)]"
              >
                <History size={12} className="mr-1.5" /> Pesquisa
              </TabsTrigger>
              <TabsTrigger 
                value="factsheet" 
                className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] transition-all data-[state=active]:bg-[var(--parchment)] data-[state=active]:text-[var(--gold2)] data-[state=active]:shadow-sm hover:text-[var(--ink)]"
              >
                <FileText size={12} className="mr-1.5" /> Fichas ({factSheet.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <ScrollArea className="flex-1 h-full px-4">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="research" className="mt-0">
              <div className="py-4 space-y-2">
                <div className="px-2 mb-2 flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Histórico</span>
                  {history.length > 0 && (
                    <Button variant="ghost" size="icon" onClick={clearHistory} className="h-6 w-6 text-[var(--faint)] hover:text-red-400">
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
                {history.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <p className="text-sm text-[var(--faint)] italic font-serif">Nenhuma pesquisa recente.</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full text-left p-3 rounded border border-transparent hover:border-[var(--border)] hover:bg-[var(--border)]/10 transition-all group relative"
                    >
                      <p className="text-sm font-medium truncate pr-6 text-[var(--ink)]">{item.query}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--faint)] mt-1">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gold2)]" />
                    </button>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="factsheet" className="mt-0">
              <div className="py-4 space-y-2">
                <div className="px-2 mb-2 flex justify-between items-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--faint)]">Fichas Técnicas</span>
                  {factSheet.length > 0 && (
                    <Button variant="ghost" size="icon" onClick={exportFactSheet} className="h-6 w-6 text-[var(--faint)] hover:text-[var(--gold2)]" title="Exportar Ficha Técnica">
                      <Download size={12} />
                    </Button>
                  )}
                </div>
                {factSheet.length === 0 ? (
                  <div className="px-2 py-8 text-center">
                    <p className="text-sm text-[var(--faint)] italic font-serif">Nenhuma ficha técnica organizada.</p>
                  </div>
                ) : (
                  factSheet.map((item) => (
                    <div
                      key={item.id}
                      className="w-full p-3 rounded border border-[var(--border)] bg-[var(--border)]/5 group relative mb-2"
                    >
                      <p className="text-sm font-medium truncate pr-8 text-[var(--ink)]">{item.title}</p>
                      <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--faint)] mt-1">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeFromFactSheet(item.id)}
                        className="absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--faint)] hover:text-red-400"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>
        
        <div className="p-6 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--faint)]">
            <Sparkles size={12} className="text-[var(--gold)]" />
            <span>Muneri · Academia ∂</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative bg-[var(--parchment)] overflow-hidden">
        {/* Results Area */}
        <ScrollArea className="flex-1 h-full" ref={scrollRef}>
          <div className="max-w-4xl mx-auto p-6 lg:p-12 pb-48 space-y-24">
            <AnimatePresence mode="popLayout">
              {sessionResearches.map((sessionItem, sIdx) => (
                <motion.div 
                  key={sessionItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-12 relative"
                >
                  {sIdx > 0 && <Separator className="bg-[var(--border)] opacity-30" />}
                  <header className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--gold2)]">
                        <GraduationCap size={14} />
                        <span>Muneri · Pesquisa {sIdx + 1}</span>
                      </div>
                      {sIdx === sessionResearches.length - 1 && (
                        <button 
                          onClick={addToFactSheet}
                          className="flex items-center gap-1.5 rounded border border-[var(--border)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--muted)] transition hover:border-[var(--gold2)] hover:text-[var(--gold2)]"
                        >
                          <Plus size={12} /> Ficha Técnica
                        </button>
                      )}
                    </div>
                    <h2 className="font-sans font-semibold text-[1.9rem] leading-[1.2] sm:text-4xl md:text-5xl md:leading-tight text-[var(--ink)] tracking-tight">
                      {sessionItem.query} com <em className="text-[var(--gold2)] not-italic">Rigor Acadêmico.</em>
                    </h2>
                    <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-[var(--faint)]">
                      <span>APA 7 Edition</span>
                      <span className="h-3 w-px bg-[var(--border)]" />
                      <span>{new Date(sessionItem.timestamp).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </header>

                  <div className="prose prose-slate max-w-none prose-headings:text-[var(--ink)] prose-p:text-[var(--muted)] prose-p:leading-relaxed prose-strong:text-[var(--ink)] prose-a:text-[var(--gold2)] font-sans text-[1.1rem] leading-relaxed tracking-tight">
                    <ReactMarkdown>{sessionItem.result.answer}</ReactMarkdown>
                  </div>

                  {sessionItem.result.sources.length > 0 && (
                    <section className="space-y-8 pt-12 border-t border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <BookOpen size={20} className="text-[var(--gold2)]" />
                        <h3 className="font-sans font-semibold text-2xl tracking-tight">Fontes de <span className="text-[var(--gold2)]">Grounding.</span></h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)]">
                        {sessionItem.result.sources.map((source, idx) => (
                          <a 
                            key={`${sessionItem.id}-src-${idx}`} 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="group p-6 bg-[var(--parchment)] hover:bg-[var(--border)]/10 transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <p className="font-sans font-medium text-lg leading-snug group-hover:text-[var(--gold2)] transition-colors">
                                {source.title}
                              </p>
                              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--faint)]">
                                {new URL(source.url).hostname}
                              </p>
                            </div>
                            <div className="mt-6 flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--faint)] group-hover:text-[var(--ink)]">Ver Fonte</span>
                              <ExternalLink size={14} className="text-[var(--faint)] group-hover:text-[var(--gold2)] transition-colors" />
                            </div>
                          </a>
                        ))}
                      </div>
                    </section>
                  )}
                </motion.div>
              ))}

              {!isLoading && sessionResearches.length === 0 && (
                <motion.div 
                  key="empty-state"
                  className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="grid h-20 w-20 place-items-center rounded-full border border-[var(--border)] bg-[var(--border)]/5 text-[var(--gold2)]">
                    <GraduationCap size={32} />
                  </div>
                  <div className="space-y-4 max-w-md">
                    <h3 className="font-serif text-3xl md:text-4xl">Academia <em className="text-[var(--gold2)]">Muneri.</em></h3>
                    <p className="text-[var(--muted)] font-serif text-lg leading-relaxed">
                      Ferramenta editorial para TCC e Monografias. Pesquise com rigor acadêmico e organize suas fichas técnicas.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 pt-4">
                    {["Metodologia Científica", "Impacto da IA na Educação", "Sustentabilidade Urbana", "Ética na Tecnologia"].map(suggestion => (
                      <button 
                        key={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className="rounded border border-[var(--border)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--muted)] transition hover:border-[var(--gold2)] hover:text-[var(--gold2)]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {isLoading && (
                <motion.div 
                  key="loading-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8 pt-12"
                >
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4 bg-[var(--border)]/20" />
                    <Skeleton className="h-4 w-1/2 bg-[var(--border)]/20" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full bg-[var(--border)]/20" />
                    <Skeleton className="h-4 w-full bg-[var(--border)]/20" />
                    <Skeleton className="h-4 w-5/6 bg-[var(--border)]/20" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Bottom Search Bar Area */}
        <div className="p-4 lg:p-8 border-t border-[var(--border)] bg-gradient-to-t from-[var(--parchment)] via-[var(--parchment)] to-transparent absolute bottom-0 left-0 right-0 z-10">
          <form onSubmit={handleResearch} className="max-w-3xl mx-auto relative">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--faint)] group-focus-within:text-[var(--gold2)] transition-colors" size={20} />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisa para TCC, Monografia ou Artigo..."
                className="pl-12 pr-12 lg:pr-32 py-7 text-base lg:text-lg rounded-2xl border-[var(--border)] bg-[var(--parchment)]/80 backdrop-blur-sm text-[var(--ink)] placeholder-[var(--faint)] focus:ring-0 focus:border-[var(--gold2)] transition-all shadow-xl"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <button 
                  type="submit" 
                  disabled={isLoading || !query.trim()}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold2)] px-4 lg:px-6 py-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-black shadow-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : (
                    <>
                      <ArrowDown size={14} className="hidden lg:block" /> 
                      <span className="hidden lg:inline">Pesquisar</span>
                      <ArrowDown size={16} className="lg:hidden" />
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="mt-3 hidden lg:flex flex-wrap justify-center gap-6 px-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--green)]">Google Grounding</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--faint)]">APA 7th Edition</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--faint)]">Rigor Acadêmico</span>
            </div>
          </form>
        </div>
      </main>
    </main>
  );
}
