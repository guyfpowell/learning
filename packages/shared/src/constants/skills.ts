export const SKILLS = {
  PM: {
    id: 'skill-001',
    name: 'Product Strategy',
    category: 'product-management',
    description: 'Learn product strategy frameworks and decision-making',
  },
  PROMPT_ENG: {
    id: 'skill-002',
    name: 'Prompt Engineering',
    category: 'ai-engineering',
    description: 'Master prompt design for better AI outputs',
  },
  USER_RESEARCH: {
    id: 'skill-003',
    name: 'User Research',
    category: 'product-management',
    description: 'Conduct effective user research and leverage insights',
  },
  AI_FUNDAMENTALS: {
    id: 'skill-004',
    name: 'AI Fundamentals',
    category: 'ai-engineering',
    description: 'Understand AI models, LLMs, and how they work',
  },
  PRODUCT_METRICS: {
    id: 'skill-005',
    name: 'Product Metrics',
    category: 'product-management',
    description: 'Define and track metrics that matter',
  },
  RETRIEVAL_AUGMENTED_GEN: {
    id: 'skill-006',
    name: 'Retrieval Augmented Generation',
    category: 'ai-engineering',
    description: 'Build RAG systems for smarter AI apps',
  },
} as const;

export const SKILL_CATEGORIES = [
  'product-management',
  'ai-engineering',
  'business',
] as const;

export const DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
