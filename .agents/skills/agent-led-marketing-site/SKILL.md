---
name: agent-led-marketing-site
description: Pattern for a marketing site whose main experience is a conversation with an AI agent ("few words, discover by talking"), built so it still ranks, gets cited by AI search, stays accessible and can't be abused for cost. Use when designing, building, reviewing or measuring the KnowMe chat-first homepage, its concierge agent, its prerendered fallback pages, AI-crawler policy, AI disclosure or rate limits.
---

# Agent-led marketing site

KnowMe markets itself by letting visitors talk to it. The conversation is the product demo, but it can't be the only thing on the page: crawlers, screen readers, people who don't want to chat and slow networks all need a path too.

## 1. The static layer comes first

AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, Claude-SearchBot, PerplexityBot) fetch HTML and do not run JavaScript. Google requires a page to be indexed and snippet-eligible before it can appear in AI features. So:

- **Prerender every marketing route** to static HTML. React Router v7 `prerender` with `ssr: false`, or Vike, fits this Vite SPA. Check with `curl -s <url> | grep '<h1'`.
- Put a real `<h1>`, a one-sentence value statement, the concierge's **opening message and prompt chips**, and a short FAQ in that HTML, before any model call.
- Keep crawlable topic pages behind the chat, each a direct answer with a 40–60 word summary under a question heading: what KnowMe is, product, pricing/availability, privacy, company, FAQ.
- Per route: unique `<title>`, description, canonical, Open Graph, and JSON-LD (`Organization`, `WebSite`, `SoftwareApplication`, `FAQPage`). React 19 hoists `<title>`/`<meta>` from components, but that only helps bots after prerendering.
- `robots.txt` names each AI bot explicitly. Blocking OAI-SearchBot or Claude-SearchBot removes the site from those assistants' answers. `sitemap.xml`, real 404 status codes. `llms.txt` is optional and helps agentic tools, not AI citations.

## 2. The conversation

- The concierge is a scoped KnowMe agent on the Universal Agent Runtime. It has its own system prompt, allowed topics and tools, and no access to user data.
- **First paint needs no network.** Opener and chips render from static HTML. Stream replies. Lazy-load heavy libraries (three.js, GSAP) only when used.
- Every answer offers a next step: a deeper page, a demo, the waitlist or download. The chat routes to the static pages rather than replacing them.
- **Disclose that it's AI**, visibly and before the first message. EU AI Act Article 50 transparency duties for chatbots apply from 2 Aug 2026. State what is stored and for how long, and link the privacy page.
- Never let raw runtime errors show as assistant text. Degrade to the static answer and a "try again" path.

## 3. Accessibility

- The message log is `aria-live="polite"`, announced per message, not per streamed token.
- The composer has a visible label and focus, and works by keyboard alone.
- Respect reduced motion. Keep a non-chat path to every piece of content (WCAG 2.2 AA; the European Accessibility Act has applied since 28 Jun 2025).

## 4. Cost and abuse (OWASP LLM10 "Unbounded Consumption")

- Per-IP and per-session rate limits; caps on turns, input size and output tokens; bot protection (e.g. Turnstile) before the first model call.
- Use a cheaper model for anonymous visitors, and cache answers to the canned chips.
- Scope the system prompt, treat user text as untrusted (prompt injection), and never expose tools that act outside the concierge scope.
- A budget kill switch at the runtime falls back to the static experience.

## 5. Measure

- **Classic:** Search Console (including AI features), Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1), conversions.
- **Conversation:** open rate, messages per session, chip vs typed starts, hand-offs to pages or CTAs, drop-off point, refusal/fallback rate, cost per conversation.
- **AI visibility:** share of voice for a fixed prompt set across ChatGPT, Claude, Perplexity and Google AI features, using a tracker (Otterly, Peec, Profound or similar) plus server logs filtered by AI user agent.

## Review checklist

- [ ] `curl` of each marketing route shows the h1, value statement, opener, chips and FAQ.
- [ ] JSON-LD validates; each route has a unique title, description and canonical.
- [ ] robots.txt AI-bot policy matches the marketing officer's decision.
- [ ] AI disclosure is visible before the first message; the privacy link works.
- [ ] Keyboard-only and screen-reader runs complete a conversation and reach every page without chatting.
- [ ] Rate limits and the budget kill switch are tested; the fallback shows static content.
- [ ] Events for each conversation metric fire in analytics.

## Sources

- Google AI features guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- OpenAI crawlers: https://developers.openai.com/api/docs/bots · Anthropic crawlers: https://support.claude.com/en/articles/8896518
- AI crawlers and JavaScript: https://www.getpassionfruit.com/blog/javascript-rendering-and-ai-crawlers-can-llms-read-your-spa
- React Router prerendering: https://reactrouter.com/how-to/pre-rendering
- EU AI Act Art. 50: https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act
- OWASP LLM10:2025: https://genai.owasp.org/llmrisk/llm102025-unbounded-consumption/
- llms.txt usage study: https://ahrefs.com/blog/llmstxt-study/
