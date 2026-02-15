/**
 * TypeScript/JavaScript symbol extractor using TS Compiler API
 */

import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { ExtractionError } from '../cli/utils/errors.js';
import type { CallSite, ExtractionResult, ImportInfo, SymbolInfo } from './types.js';

export class TypeScriptExtractor {
  /**
   * Extract all symbols from a TypeScript/JavaScript file
   */
  extractSymbols(filePath: string): ExtractionResult {
    const symbols: SymbolInfo[] = [];
    const errors: string[] = [];

    try {
      const sourceText = readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

      const visit = (node: ts.Node) => {
        try {
          // Function declarations: function foo() {}
          if (ts.isFunctionDeclaration(node) && node.name) {
            symbols.push(this.extractFunction(node, sourceFile));
          }

          // Arrow functions: const foo = () => {}
          if (ts.isVariableStatement(node) && node.declarationList.declarations.length > 0) {
            const decl = node.declarationList.declarations[0];
            if (
              decl.initializer &&
              (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
            ) {
              symbols.push(this.extractArrowFunction(decl, sourceFile));
            }
          }

          // Class declarations: class Foo {}
          if (ts.isClassDeclaration(node) && node.name) {
            symbols.push(this.extractClass(node, sourceFile));
          }

          // Recurse into child nodes
          ts.forEachChild(node, visit);
        } catch (error) {
          errors.push(
            `Error extracting from node at ${node.pos}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      };

      visit(sourceFile);
    } catch (error) {
      throw new ExtractionError(
        `Failed to extract symbols from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return { symbols, errors };
  }

  /**
   * Extract a single symbol by name
   */
  extractSymbol(filePath: string, symbolName: string): SymbolInfo | null {
    const result = this.extractSymbols(filePath);
    return result.symbols.find((s) => s.name === symbolName) || null;
  }

  /**
   * Extract call sites from a symbol's body
   * Returns the names of functions/methods called within the symbol
   */
  extractCallSites(filePath: string, symbolName: string): CallSite[] {
    const sourceText = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

    // Find the symbol's AST node
    const bodyNode = this.findSymbolBody(sourceFile, symbolName);
    if (!bodyNode) return [];

    const callSites: CallSite[] = [];
    const seen = new Set<string>();

    const walk = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expression = node.expression.getText(sourceFile);
        // Extract the function name (last identifier in the chain)
        const name = this.extractCallName(node.expression, sourceFile);
        if (name && !seen.has(name)) {
          seen.add(name);
          callSites.push({ name, expression });
        }
      }
      ts.forEachChild(node, walk);
    };

    walk(bodyNode);
    return callSites;
  }

  /**
   * Extract import declarations from a file
   */
  extractImports(filePath: string): ImportInfo[] {
    const sourceText = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

    const imports: ImportInfo[] = [];

    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isImportDeclaration(node)) return;

      const moduleSpecifier = node.moduleSpecifier;
      if (!ts.isStringLiteral(moduleSpecifier)) return;
      const source = moduleSpecifier.text;

      const importClause = node.importClause;
      if (!importClause) return;

      // Skip type-only imports: import type { Foo } from "..."
      if (importClause.isTypeOnly) return;

      // Default import: import Foo from "..."
      if (importClause.name) {
        const name = importClause.name.getText(sourceFile);
        imports.push({ name, originalName: name, source, isDefault: true });
      }

      // Named imports: import { Foo, Bar, original as renamed } from "..."
      if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
        for (const element of importClause.namedBindings.elements) {
          // Skip type-only elements: import { type Foo } from "..."
          if (element.isTypeOnly) continue;

          const localName = element.name.getText(sourceFile);
          // propertyName is the original export name (only present when renamed)
          const originalName = element.propertyName
            ? element.propertyName.getText(sourceFile)
            : localName;
          imports.push({ name: localName, originalName, source, isDefault: false });
        }
      }
    });

    return imports;
  }

  /**
   * Find the body AST node for a named symbol
   */
  private findSymbolBody(sourceFile: ts.SourceFile, symbolName: string): ts.Node | null {
    let body: ts.Node | null = null;

    const visit = (node: ts.Node) => {
      if (body) return;

      if (ts.isFunctionDeclaration(node) && node.name?.getText(sourceFile) === symbolName) {
        body = node.body || null;
        return;
      }

      if (ts.isVariableStatement(node)) {
        const decl = node.declarationList.declarations[0];
        if (decl?.name.getText(sourceFile) === symbolName && decl.initializer) {
          if (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer)) {
            body = decl.initializer.body || null;
            return;
          }
        }
      }

      if (ts.isClassDeclaration(node) && node.name?.getText(sourceFile) === symbolName) {
        body = node;
        return;
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return body;
  }

  /**
   * Extract the callable name from a call expression
   * e.g. `foo()` → "foo", `this.bar()` → "bar", `obj.method()` → "method"
   */
  private extractCallName(expr: ts.Expression, sourceFile: ts.SourceFile): string | null {
    if (ts.isIdentifier(expr)) {
      return expr.getText(sourceFile);
    }
    if (ts.isPropertyAccessExpression(expr)) {
      return expr.name.getText(sourceFile);
    }
    return null;
  }

  /**
   * Extract function declaration
   */
  private extractFunction(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): SymbolInfo {
    const name = node.name?.getText(sourceFile);
    const fullText = node.getText(sourceFile);

    // Extract parameters (everything between parentheses)
    const params = node.parameters.map((p) => p.getText(sourceFile)).join(', ');

    // Extract body (everything inside the braces)
    const body = node.body ? node.body.getText(sourceFile) : '';

    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.pos);
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.end);

    return {
      name,
      kind: 'function',
      filePath: sourceFile.fileName,
      params,
      body,
      fullText,
      startLine: startLine + 1,
      endLine: endLine + 1,
    };
  }

  /**
   * Extract arrow function or function expression
   */
  private extractArrowFunction(
    decl: ts.VariableDeclaration,
    sourceFile: ts.SourceFile,
  ): SymbolInfo {
    const name = decl.name.getText(sourceFile);
    const func = decl.initializer!;

    let params = '';
    let body = '';

    if (ts.isArrowFunction(func)) {
      params = func.parameters.map((p) => p.getText(sourceFile)).join(', ');
      body = ts.isBlock(func.body)
        ? func.body.getText(sourceFile)
        : `{ return ${func.body.getText(sourceFile)} }`;
    } else if (ts.isFunctionExpression(func)) {
      params = func.parameters.map((p) => p.getText(sourceFile)).join(', ');
      body = func.body ? func.body.getText(sourceFile) : '';
    }

    const fullText = decl.getText(sourceFile);
    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(decl.pos);
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(decl.end);

    return {
      name,
      kind: 'const',
      filePath: sourceFile.fileName,
      params,
      body,
      fullText,
      startLine: startLine + 1,
      endLine: endLine + 1,
    };
  }

  /**
   * Extract class declaration
   */
  private extractClass(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): SymbolInfo {
    const name = node.name?.getText(sourceFile);
    const fullText = node.getText(sourceFile);

    // For classes, we treat the whole class as the "body"
    // Individual methods can be extracted separately if needed
    const body = fullText;

    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.pos);
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.end);

    return {
      name,
      kind: 'class',
      filePath: sourceFile.fileName,
      params: '', // Classes don't have params at the class level
      body,
      fullText,
      startLine: startLine + 1,
      endLine: endLine + 1,
    };
  }
}
