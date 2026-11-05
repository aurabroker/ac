/**
 * Polityka botów (PLAN §4.2) — jedno źródło dla robots.txt.
 * Allow dla wyszukiwarek, botów cytowania i treningowych; Disallow: / tylko Bytespider.
 */
export interface BotRule {
  agents: string[];
  role: string;
  allow: boolean;
}

export const BOT_RULES: BotRule[] = [
  { agents: ['Googlebot', 'Bingbot'], role: 'Google (AIO, AI Mode), Bing i Copilot', allow: true },
  { agents: ['Google-Extended', 'Applebot-Extended'], role: 'trening Gemini, trening Apple', allow: true },
  { agents: ['OAI-SearchBot', 'ChatGPT-User', 'GPTBot'], role: 'OpenAI: indeks, pobrania użytkownika, trening', allow: true },
  { agents: ['Claude-SearchBot', 'Claude-User', 'ClaudeBot'], role: 'Anthropic: indeks, pobrania, trening', allow: true },
  { agents: ['PerplexityBot', 'Perplexity-User'], role: 'Perplexity: indeks, pobrania', allow: true },
  {
    agents: ['Applebot', 'meta-externalagent', 'Meta-ExternalFetcher', 'CCBot', 'Amazonbot', 'DuckAssistBot'],
    role: 'asystenci, Common Crawl',
    allow: true,
  },
  { agents: ['AhrefsBot', 'SemrushBot'], role: 'narzędzia SEO', allow: true },
  { agents: ['Bytespider'], role: 'trening ByteDance', allow: false },
];

/** Ścieżki wyłączone w każdej grupie (np. przyszła wyszukiwarka). */
export const DISALLOW_PATHS = ['/szukaj'];

export const CONTENT_SIGNAL = 'search=yes, ai-input=yes, ai-train=yes';

/**
 * PREVIEW (podgląd gałęzi): wyszukiwarki i boty treningowe — Disallow, cały serwis noindex.
 * Wpuszczamy tylko agentów pobierających stronę na prośbę użytkownika (np. „sprawdź tę stronę” w ChatGPT,
 * Claude, Perplexity) — właściciel robi samokontrolę treści. Content-Signal: bez wyszukiwarki i treningu.
 */
export const PREVIEW_USER_AGENTS = ['ChatGPT-User', 'Claude-User', 'Perplexity-User', 'MistralAI-User', 'Meta-ExternalFetcher'];
export const PREVIEW_CONTENT_SIGNAL = 'search=no, ai-input=yes, ai-train=no';
