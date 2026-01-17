-- ============================================================================
-- SEED DATA FOR AI TOOLS MARKETPLACE
-- ============================================================================
-- This adds realistic AI tools to the marketplace for testing and initial use

-- ChatGPT (OpenAI)
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'ChatGPT',
  'Advanced language model for natural conversations, content creation, coding assistance, and complex problem solving.',
  'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  'productivity',
  'OpenAI',
  'subscription',
  ARRAY['text generation', 'code completion', 'research', 'writing', 'analysis'],
  1.5,
  true,
  20.00,
  'https://platform.openai.com/docs'
);

-- Claude (Anthropic)
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Claude',
  'Advanced AI assistant focused on safety, accuracy, and thoughtful reasoning. Excellent for complex analysis and long-form content.',
  'https://anthropic.com/images/icons/claude-avatar.svg',
  'productivity',
  'Anthropic',
  'subscription',
  ARRAY['analysis', 'writing', 'coding', 'research', 'reasoning'],
  1.6,
  true,
  20.00,
  'https://docs.anthropic.com'
);

-- GitHub Copilot
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'GitHub Copilot',
  'AI pair programmer that suggests code and entire functions in real-time. Integrates directly into your IDE.',
  'https://github.githubassets.com/images/modules/site/copilot/copilot.png',
  'coding',
  'GitHub (OpenAI)',
  'subscription',
  ARRAY['code completion', 'function generation', 'test writing', 'documentation'],
  2.0,
  true,
  10.00,
  'https://docs.github.com/copilot'
);

-- Cursor
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Cursor',
  'AI-first code editor built for pair programming with AI. Features codebase-aware suggestions and chat.',
  'https://cursor.sh/favicon.ico',
  'coding',
  'Anysphere',
  'subscription',
  ARRAY['code editing', 'codebase understanding', 'refactoring', 'debugging'],
  2.2,
  true,
  20.00,
  'https://cursor.sh/docs'
);

-- Midjourney
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Midjourney',
  'AI image generator for creating stunning artwork, product mockups, and marketing visuals from text descriptions.',
  'https://cdn.midjourney.com/favicon.ico',
  'design',
  'Midjourney',
  'subscription',
  ARRAY['image generation', 'concept art', 'product mockups', 'marketing visuals'],
  1.8,
  true,
  30.00,
  'https://docs.midjourney.com'
);

-- Figma AI
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Figma AI',
  'AI-powered design tools built into Figma. Generate designs, rename layers intelligently, and auto-layout components.',
  'https://static.figma.com/app/icon/1/favicon.svg',
  'design',
  'Figma',
  'free',
  ARRAY['design generation', 'auto-layout', 'smart rename', 'component organization'],
  1.4,
  true,
  0.00,
  'https://help.figma.com/hc/en-us/articles/17903103192343-Figma-AI'
);

-- Jasper AI
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Jasper AI',
  'AI content creation platform specialized in marketing copy, blog posts, and social media content.',
  'https://www.jasper.ai/favicon.ico',
  'marketing',
  'Jasper',
  'subscription',
  ARRAY['copywriting', 'blog writing', 'social media', 'SEO optimization', 'brand voice'],
  1.7,
  true,
  49.00,
  'https://www.jasper.ai/resources'
);

-- Copy.ai
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Copy.ai',
  'AI writing assistant for marketing teams. Generate blog posts, product descriptions, and ad copy in seconds.',
  'https://www.copy.ai/favicon.ico',
  'marketing',
  'Copy.ai',
  'subscription',
  ARRAY['ad copy', 'product descriptions', 'email marketing', 'social posts'],
  1.6,
  true,
  36.00,
  'https://www.copy.ai/learn'
);

-- Tableau AI (Einstein Copilot)
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  documentation_url
) VALUES (
  'Tableau AI',
  'AI-powered data analytics that automatically generates insights, visualizations, and explanations from your data.',
  'https://www.tableau.com/themes/custom/tableau_www/logo.svg',
  'data_analysis',
  'Tableau (Salesforce)',
  'enterprise',
  ARRAY['data visualization', 'automated insights', 'natural language queries', 'trend analysis'],
  1.9,
  true,
  'https://help.tableau.com/current/pro/desktop/en-us/einstein_discovery.htm'
);

-- Intercom Fin
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Intercom Fin',
  'AI customer support agent that resolves 50% of support queries instantly using your knowledge base.',
  'https://www.intercom.com/favicon.ico',
  'customer_support',
  'Intercom',
  'subscription',
  ARRAY['automated responses', 'ticket resolution', 'knowledge base integration', 'multilingual support'],
  2.5,
  true,
  0.99,
  'https://www.intercom.com/help/en/collections/6857461-fin-ai-agent'
);

-- Zendesk AI
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  documentation_url
) VALUES (
  'Zendesk AI',
  'Intelligent customer service automation with AI-powered ticket routing, response suggestions, and sentiment analysis.',
  'https://www.zendesk.com/favicon.ico',
  'customer_support',
  'Zendesk',
  'enterprise',
  ARRAY['ticket routing', 'response suggestions', 'sentiment analysis', 'intent detection'],
  1.8,
  true,
  'https://support.zendesk.com/hc/en-us/articles/4408832434714-About-Advanced-AI'
);

-- Grammarly Business
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Grammarly Business',
  'AI writing assistant that improves clarity, tone, and correctness across all your business communications.',
  'https://static.grammarly.com/assets/files/efe9c4526aec3ab7cf303dc1ee65baef/favicon.svg',
  'productivity',
  'Grammarly',
  'subscription',
  ARRAY['grammar checking', 'tone adjustment', 'clarity improvement', 'plagiarism detection'],
  1.3,
  true,
  15.00,
  'https://support.grammarly.com/hc/en-us'
);

-- Notion AI
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Notion AI',
  'AI assistant built into Notion for brainstorming, writing, summarizing, and organizing your workspace.',
  'https://www.notion.so/images/favicon.ico',
  'productivity',
  'Notion',
  'subscription',
  ARRAY['writing assistance', 'summarization', 'brainstorming', 'task organization'],
  1.4,
  true,
  10.00,
  'https://www.notion.so/help/guides/what-is-notion-ai'
);

-- Perplexity Pro
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Perplexity Pro',
  'AI-powered research assistant that provides accurate answers with citations from reliable sources.',
  'https://www.perplexity.ai/favicon.svg',
  'productivity',
  'Perplexity',
  'subscription',
  ARRAY['research', 'fact-checking', 'source citation', 'web search'],
  1.5,
  true,
  20.00,
  'https://www.perplexity.ai/hub'
);

-- ElevenLabs
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  per_use_cost,
  documentation_url
) VALUES (
  'ElevenLabs',
  'AI voice generation for creating realistic voiceovers, podcasts, and audio content in multiple languages.',
  'https://elevenlabs.io/favicon.ico',
  'marketing',
  'ElevenLabs',
  'per_use',
  ARRAY['voice synthesis', 'text to speech', 'voice cloning', 'multilingual audio'],
  1.6,
  true,
  0.00,
  0.30,
  'https://elevenlabs.io/docs'
);

-- Make.com (Integromat)
INSERT INTO public.ai_tools (
  name,
  description,
  icon_url,
  category,
  provider,
  pricing_model,
  capabilities,
  multiplier_effect,
  is_active,
  monthly_cost,
  documentation_url
) VALUES (
  'Make.com',
  'Visual automation platform with AI capabilities for connecting apps and automating workflows without code.',
  'https://www.make.com/en/favicon/favicon.ico',
  'productivity',
  'Make.com',
  'subscription',
  ARRAY['workflow automation', 'app integration', 'data transformation', 'scheduled tasks'],
  2.0,
  true,
  9.00,
  'https://www.make.com/en/help'
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the seed data was inserted:

-- SELECT name, category, provider, pricing_model, multiplier_effect, is_active
-- FROM public.ai_tools
-- ORDER BY category, name;
