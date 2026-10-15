import { definePlugin, type ContentPolicyEvent, type ContentPolicyDecision } from 'emdash';
import { hasBlockedAmazonBodyLink, hasEditorialBodyText, hasUnsupportedBodyBlocks, safeResearchHref } from '../lib/cms-policy.ts';

/** Central CMS publication guard: applies to admin, API, and scheduled publish. */
export function validatePublication(event: ContentPolicyEvent): ContentPolicyDecision {
  if (event.collection !== 'guides') return;
  const data = event.content.data as Record<string, unknown> | undefined;
  if (!data) return { cancel: true, reason: 'Editorial fields are missing.' };
  const requiredText = ['title', 'summary', 'author_name', 'editor_name', 'reader_question', 'analysis_limitations', 'image_rights', 'conflict_statement'];
  const missing = requiredText.filter((key) => typeof data[key] !== 'string' || !(data[key] as string).trim());
  if (missing.length) return { cancel: true, reason: `Complete the editorial fields before publishing: ${missing.join(', ')}.` };
  if (!['compliance_review', 'published'].includes(String(data.workflow_state))) {
    return { cancel: true, reason: 'Move the guide through editor review to compliance review before publishing.' };
  }
  if (data.editorial_approved !== true || data.rights_confirmed !== true) {
    return { cancel: true, reason: 'The editor must confirm the editorial review and rights to all included media.' };
  }
  if (!Array.isArray(data.research_sources) || data.research_sources.length === 0) {
    return { cancel: true, reason: 'Add the research sources before publishing.' };
  }
  const invalidSource = data.research_sources.some((source: unknown) => {
    if (!source || typeof source !== 'object') return true;
    const item = source as Record<string, unknown>;
    if (typeof item.label !== 'string' || !item.label.trim() || typeof item.url !== 'string') return true;
    return !safeResearchHref(item.url);
  });
  if (invalidSource) return { cancel: true, reason: 'Every source needs a descriptive label and an untracked web URL. Amazon retail and short links belong in verified product references.' };
  if (!Array.isArray(data.content) || data.content.length === 0) {
    return { cancel: true, reason: 'Add substantive editorial content before publishing.' };
  }
  if (!hasEditorialBodyText(data.content)) {
    return { cancel: true, reason: 'Write the editorial body before publishing; empty blocks are not article content.' };
  }
  if (hasBlockedAmazonBodyLink(data.content)) {
    return { cancel: true, reason: 'Remove Amazon links from the article body. Use verified product references so the site can apply disclosure and affiliate controls.' };
  }
  if (hasUnsupportedBodyBlocks(data.content)) {
    return { cancel: true, reason: 'Use editorial text, tables, code, and uploaded media in the article body. Raw HTML, embeds, and buttons are outside this theme.' };
  }
  if (data.evidence_type === 'Hands-on tested' && (typeof data.test_notes !== 'string' || !data.test_notes.trim())) {
    return { cancel: true, reason: 'Hands-on testing requires test notes. Use an editorial or researched label otherwise.' };
  }
  if (typeof data.reviewed_at !== 'string' || Number.isNaN(Date.parse(data.reviewed_at)) || Date.parse(data.reviewed_at) > Date.now()) {
    return { cancel: true, reason: 'Enter the actual review date; future or empty review dates are not accepted.' };
  }
  if (event.content.publishedAt && (typeof data.revision_reason !== 'string' || !data.revision_reason.trim())) {
    return { cancel: true, reason: 'Record the reason for revising an already published guide before publishing changes.' };
  }
}

export function createPlugin() {
  return definePlugin({
    id: 'desk-edit-editorial-gate',
    version: '1.0.0',
    capabilities: ['hooks.content-policy:register'],
    hooks: {
      'content:beforePublish': async (event) => validatePublication(event),
      'content:beforeSchedule': async (event) => validatePublication(event),
    },
  });
}
