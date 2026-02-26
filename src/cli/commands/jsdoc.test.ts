import { describe, expect, it } from 'vitest';
import { JSDOC_AGENT_PROMPT } from './jsdoc.js';

describe('JSDOC_AGENT_PROMPT', () => {
  it('contains all required sections', () => {
    expect(JSDOC_AGENT_PROMPT).toContain('## What "symbols" means');
    expect(JSDOC_AGENT_PROMPT).toContain('## Feedback loop');
    expect(JSDOC_AGENT_PROMPT).toContain('## Process');
    expect(JSDOC_AGENT_PROMPT).toContain('## Writing JSDoc comments');
    expect(JSDOC_AGENT_PROMPT).toContain('## Example');
    expect(JSDOC_AGENT_PROMPT).toContain('## Important');
  });

  it('references the wend jsdoc command', () => {
    expect(JSDOC_AGENT_PROMPT).toContain('npx wend jsdoc');
    expect(JSDOC_AGENT_PROMPT).toContain('npx wend jsdoc --verbose');
  });

  it('includes style guidance for @param without types', () => {
    expect(JSDOC_AGENT_PROMPT).toContain('@param name - description');
    expect(JSDOC_AGENT_PROMPT).toContain('Do not repeat the type');
  });

  it('instructs not to modify code', () => {
    expect(JSDOC_AGENT_PROMPT).toContain('Do NOT change any code');
    expect(JSDOC_AGENT_PROMPT).toContain('only add JSDoc comments');
  });

  it('instructs file-by-file workflow', () => {
    expect(JSDOC_AGENT_PROMPT).toContain('Work file by file, not symbol by symbol');
  });

  it('does not mention @deprecated', () => {
    expect(JSDOC_AGENT_PROMPT).not.toContain('@deprecated');
  });

  it('scopes JSDoc requirements to exported symbols only', () => {
    expect(JSDOC_AGENT_PROMPT).toContain('Only **exported** symbols require');
    expect(JSDOC_AGENT_PROMPT).toContain('Non-exported (file-private) symbols do not need JSDoc');
  });
});
