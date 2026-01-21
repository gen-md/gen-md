/**
 * Refinement Session Management
 *
 * Manages the state of interactive refinement sessions.
 */

import { createHash } from "node:crypto";
import type { RefineSession, RefineEntry, PredictionContext } from "../types.js";
import { providers } from "../providers/index.js";
import { Predictor, buildPredictionContext } from "../core/predictor.js";
import { createResolver } from "../core/resolver.js";

/**
 * Create a new refinement session
 */
export function createSession(specPath: string): RefineSession {
  return {
    specPath,
    currentContent: "",
    history: [],
    feedback: [],
    startedAt: new Date(),
  };
}

/**
 * Add an entry to the session history
 */
export function addEntry(
  session: RefineSession,
  content: string,
  options: {
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    feedback?: string;
  }
): RefineEntry {
  const entry: RefineEntry = {
    content,
    hash: createHash("sha256").update(content).digest("hex").slice(0, 7),
    timestamp: new Date(),
    feedback: options.feedback,
    model: options.model,
    provider: options.provider,
    tokens: {
      input: options.inputTokens,
      output: options.outputTokens,
    },
  };

  session.history.push(entry);
  session.currentContent = content;

  return entry;
}

/**
 * Get the current version number (1-indexed)
 */
export function getCurrentVersion(session: RefineSession): number {
  return session.history.length;
}

/**
 * Get a specific version by index (1-indexed)
 */
export function getVersion(session: RefineSession, version: number): RefineEntry | undefined {
  return session.history[version - 1];
}

/**
 * Go back to a previous version
 */
export function goBack(session: RefineSession): RefineEntry | undefined {
  if (session.history.length <= 1) {
    return undefined;
  }

  // Remove the current version
  session.history.pop();

  // Set current content to the previous version
  const previous = session.history[session.history.length - 1];
  session.currentContent = previous.content;

  return previous;
}

/**
 * Generate initial content for a session
 */
export async function generateInitial(
  session: RefineSession,
  options: {
    provider?: string;
    model?: string;
    gitContext?: PredictionContext["gitContext"];
  } = {}
): Promise<RefineEntry> {
  const resolver = createResolver();
  const resolved = await resolver.resolve(session.specPath);

  const context = await buildPredictionContext(resolved, {
    gitContext: options.gitContext,
    includeExisting: true,
  });

  const providerName = options.provider || providers.getDefaultName();
  const provider = providers.get(providerName);

  if (!provider) {
    throw new Error(`Provider "${providerName}" not found`);
  }

  const model = options.model || provider.models()[0];

  const predictor = new Predictor({
    provider: providerName,
    model,
  });

  const result = await predictor.predict(context);

  return addEntry(session, result.content, {
    model: result.model,
    provider: providerName,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });
}

/**
 * Refine the current content with feedback
 */
export async function refineWithFeedback(
  session: RefineSession,
  feedback: string,
  options: {
    provider?: string;
    model?: string;
    gitContext?: PredictionContext["gitContext"];
  } = {}
): Promise<RefineEntry> {
  const resolver = createResolver();
  const resolved = await resolver.resolve(session.specPath);

  // Build context with current content as "existing"
  const context = await buildPredictionContext(resolved, {
    gitContext: options.gitContext,
    includeExisting: false,
  });

  // Override existing content with current session content
  context.existingContent = session.currentContent;

  const providerName = options.provider || providers.getDefaultName();
  const provider = providers.get(providerName);

  if (!provider) {
    throw new Error(`Provider "${providerName}" not found`);
  }

  const model = options.model || provider.models()[0];

  // Build a refinement prompt
  const refinementPrompt = buildRefinementPrompt(
    session.currentContent,
    feedback,
    resolved.body
  );

  const result = await providers.generate(refinementPrompt, {
    model,
    provider: providerName,
  });

  // Track feedback
  session.feedback.push(feedback);

  return addEntry(session, result.content, {
    model: result.model,
    provider: providerName,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    feedback,
  });
}

/**
 * Build a prompt for refinement
 */
function buildRefinementPrompt(
  currentContent: string,
  feedback: string,
  originalInstructions: string
): string {
  return `You are refining generated content based on user feedback.

## Original Instructions
${originalInstructions}

## Current Content
\`\`\`
${currentContent}
\`\`\`

## User Feedback
${feedback}

## Task
Modify the current content according to the user's feedback.
- Keep the overall structure and intent from the original instructions
- Apply the specific changes requested in the feedback
- Output ONLY the refined content, no explanations or markdown fences
- Preserve formatting and style unless specifically asked to change it`;
}

/**
 * Calculate total tokens used in session
 */
export function getTotalTokens(session: RefineSession): { input: number; output: number } {
  return session.history.reduce(
    (acc, entry) => ({
      input: acc.input + entry.tokens.input,
      output: acc.output + entry.tokens.output,
    }),
    { input: 0, output: 0 }
  );
}

/**
 * Get session summary
 */
export function getSessionSummary(session: RefineSession): string {
  const tokens = getTotalTokens(session);
  const duration = Date.now() - session.startedAt.getTime();
  const minutes = Math.floor(duration / 60000);
  const seconds = Math.floor((duration % 60000) / 1000);

  return `Session: ${session.history.length} version(s), ${tokens.input + tokens.output} tokens, ${minutes}m ${seconds}s`;
}
