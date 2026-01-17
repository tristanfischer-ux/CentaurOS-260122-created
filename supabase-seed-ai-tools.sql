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
  monthly_cost
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
  20.00
);

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
  monthly_cost
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
  20.00
);

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
  monthly_cost
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
  10.00
);

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
  monthly_cost
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
  20.00
);

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
  monthly_cost
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
  30.00
);

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
  monthly_cost
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
  0.00
);

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
  monthly_cost
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
  49.00
);

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
  monthly_cost
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
  36.00
);

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
  monthly_cost
) VALUES (
  'Tableau AI',
  'AI-powered data analytics that automatically generates insights, visualizations, and explanations from your data.',
  'https://www.tableau.com/themes/custom/tableau_www/logo.svg',
  'productivity',
  'Tableau (Salesforce)',
  'subscription',
  ARRAY['data visualization', 'automated insights', 'natural language queries', 'trend analysis'],
  1.9,
  true,
  99.00
);

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
  monthly_cost
) VALUES (
  'Intercom Fin',
  'AI customer support agent that resolves 50% of support queries instantly using your knowledge base.',
  'https://www.intercom.com/favicon.ico',
  'productivity',
  'Intercom',
  'subscription',
  ARRAY['automated responses', 'ticket resolution', 'knowledge base integration', 'multilingual support'],
  2.5,
  true,
  0.99
);

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
  monthly_cost
) VALUES (
  'Zendesk AI',
  'Intelligent customer service automation with AI-powered ticket routing, response suggestions, and sentiment analysis.',
  'https://www.zendesk.com/favicon.ico',
  'productivity',
  'Zendesk',
  'subscription',
  ARRAY['ticket routing', 'response suggestions', 'sentiment analysis', 'intent detection'],
  1.8,
  true,
  89.00
);

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
  monthly_cost
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
  15.00
);

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
  monthly_cost
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
  10.00
);

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
  monthly_cost
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
  20.00
);

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
  monthly_cost
) VALUES (
  'ElevenLabs',
  'AI voice generation for creating realistic voiceovers, podcasts, and audio content in multiple languages.',
  'https://elevenlabs.io/favicon.ico',
  'marketing',
  'ElevenLabs',
  'subscription',
  ARRAY['voice synthesis', 'text to speech', 'voice cloning', 'multilingual audio'],
  1.6,
  true,
  11.00
);

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
  monthly_cost
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
  9.00
);
