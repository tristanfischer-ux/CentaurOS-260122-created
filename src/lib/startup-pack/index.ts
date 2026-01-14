// Startup Pack - Educational hub for UK company setup
// Re-export everything for easy imports

export { STARTUP_PACK_SECTIONS, getSectionById, getSectionsByTag } from './sections';
export { STARTUP_PACK_ARTICLES, getArticlesBySectionId, getArticleById, searchArticles } from './articles';
export { STARTUP_PACK_CHECKLISTS, getChecklistBySectionId, getChecklistItemById, getCriticalItems, getTotalEstimatedHours } from './checklists';
export { STARTUP_PACK_TEMPLATES, getTemplatesBySectionId, getTemplateById, searchTemplates, fillTemplateVariables } from './templates';
export { useStartupPackStore, generateSetupOKRData } from './store';
