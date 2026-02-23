import * as p from '@clack/prompts';
import { describe, expect, it, vi } from 'vitest';
import type { ProjectScan } from './next-suggestion.js';
import { renderMissingJsDocList } from './next-suggestion.js';

vi.mock('@clack/prompts', () => ({
  log: {
    warn: vi.fn(),
    message: vi.fn(),
  },
}));

function makeScan(overrides: Partial<ProjectScan> = {}): ProjectScan {
  return {
    sourceFiles: [],
    allSymbols: [],
    documentedSymbols: new Set<string>(),
    totalSymbols: 0,
    documented: 0,
    undocumented: 0,
    coverage: 100,
    exportedSymbols: 0,
    withJsDoc: 0,
    ...overrides,
  };
}

describe('renderMissingJsDocList', () => {
  it('does nothing when all exported symbols have JSDoc', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({ totalSymbols: 5, exportedSymbols: 5, withJsDoc: 5 });
    renderMissingJsDocList(scan, false);

    expect(p.log.warn).not.toHaveBeenCalled();
    expect(p.log.message).not.toHaveBeenCalled();
  });

  it('renders list when missing count is 20 or fewer', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({
      totalSymbols: 3,
      exportedSymbols: 3,
      withJsDoc: 1,
      allSymbols: [
        { file: '/project/src/foo.ts', symbol: { name: 'bar', hasJsDoc: false, isExported: true } },
        { file: '/project/src/foo.ts', symbol: { name: 'baz', hasJsDoc: false, isExported: true } },
        { file: '/project/src/foo.ts', symbol: { name: 'qux', hasJsDoc: true, isExported: true } },
      ],
    });

    renderMissingJsDocList(scan, false);

    expect(p.log.warn).toHaveBeenCalledWith('Symbols missing JSDoc:');
    const message = vi.mocked(p.log.message).mock.calls[0][0] as string;
    expect(message).toContain('bar');
    expect(message).toContain('baz');
    expect(message).not.toContain('qux');
  });

  it('shows verbose hint when missing count exceeds 20 and verbose is false', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({
      totalSymbols: 25,
      exportedSymbols: 25,
      withJsDoc: 0,
      allSymbols: Array.from({ length: 25 }, (_, i) => ({
        file: `/project/src/file${i}.ts`,
        symbol: { name: `sym${i}`, hasJsDoc: false, isExported: true },
      })),
    });

    renderMissingJsDocList(scan, false);

    expect(p.log.warn).not.toHaveBeenCalled();
    const message = vi.mocked(p.log.message).mock.calls[0][0] as string;
    expect(message).toContain('--verbose');
    expect(message).toContain('25');
  });

  it('renders all symbols when verbose is true, even with more than 20', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({
      totalSymbols: 25,
      exportedSymbols: 25,
      withJsDoc: 0,
      allSymbols: Array.from({ length: 25 }, (_, i) => ({
        file: `/project/src/file${i}.ts`,
        symbol: { name: `sym${i}`, hasJsDoc: false, isExported: true },
      })),
    });

    renderMissingJsDocList(scan, true);

    expect(p.log.warn).toHaveBeenCalledWith('Symbols missing JSDoc:');
    const message = vi.mocked(p.log.message).mock.calls[0][0] as string;
    expect(message).toContain('sym0');
    expect(message).toContain('sym24');
  });

  it('groups symbols by file', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({
      totalSymbols: 3,
      exportedSymbols: 3,
      withJsDoc: 0,
      allSymbols: [
        { file: '/project/src/a.ts', symbol: { name: 'alpha', hasJsDoc: false, isExported: true } },
        { file: '/project/src/b.ts', symbol: { name: 'beta', hasJsDoc: false, isExported: true } },
        {
          file: '/project/src/a.ts',
          symbol: { name: 'gamma', hasJsDoc: false, isExported: true },
        },
      ],
    });

    renderMissingJsDocList(scan, false);

    const message = vi.mocked(p.log.message).mock.calls[0][0] as string;
    // Both alpha and gamma should appear under the same file grouping
    const lines = message.split('\n');
    const aFileLines = lines.filter(
      (l) => l.includes('a.ts') || l.includes('alpha') || l.includes('gamma'),
    );
    expect(aFileLines.length).toBeGreaterThanOrEqual(3);
  });

  it('excludes non-exported symbols from missing JSDoc list', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({
      totalSymbols: 3,
      exportedSymbols: 1,
      withJsDoc: 0,
      allSymbols: [
        {
          file: '/project/src/foo.ts',
          symbol: { name: 'exported', hasJsDoc: false, isExported: true },
        },
        {
          file: '/project/src/foo.ts',
          symbol: { name: 'internal', hasJsDoc: false, isExported: false },
        },
        {
          file: '/project/src/foo.ts',
          symbol: { name: 'log', hasJsDoc: false, isExported: false },
        },
      ],
    });

    renderMissingJsDocList(scan, false);

    expect(p.log.warn).toHaveBeenCalledWith('Symbols missing JSDoc:');
    const message = vi.mocked(p.log.message).mock.calls[0][0] as string;
    expect(message).toContain('exported');
    expect(message).not.toContain('internal');
    expect(message).not.toContain('log');
  });

  it('reports full coverage when only non-exported symbols lack JSDoc', () => {
    vi.mocked(p.log.warn).mockClear();
    vi.mocked(p.log.message).mockClear();

    const scan = makeScan({
      totalSymbols: 3,
      exportedSymbols: 1,
      withJsDoc: 1,
      allSymbols: [
        {
          file: '/project/src/foo.ts',
          symbol: { name: 'exported', hasJsDoc: true, isExported: true },
        },
        {
          file: '/project/src/foo.ts',
          symbol: { name: 'internal', hasJsDoc: false, isExported: false },
        },
        {
          file: '/project/src/foo.ts',
          symbol: { name: 'log', hasJsDoc: false, isExported: false },
        },
      ],
    });

    renderMissingJsDocList(scan, false);

    // Should not render anything since all exported symbols have JSDoc
    expect(p.log.warn).not.toHaveBeenCalled();
    expect(p.log.message).not.toHaveBeenCalled();
  });
});
