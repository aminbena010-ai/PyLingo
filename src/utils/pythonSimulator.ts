export interface PythonSimulationResult {
  stdout: string;
  stderr: string;
}

const toTraceback = (line: number, type: string, message: string) =>
  [
    'Traceback (most recent call last):',
    `  File "main.py", line ${line}, in <module>`,
    `${type}: ${message}`
  ].join('\n');

const hasBalancedChars = (text: string, open: string, close: string) => {
  let count = 0;
  for (const ch of text) {
    if (ch === open) count += 1;
    if (ch === close) count -= 1;
    if (count < 0) return false;
  }
  return count === 0;
};

const hasBalancedQuotes = (text: string) => {
  let single = 0;
  let double = 0;
  for (const ch of text) {
    if (ch === "'") single += 1;
    if (ch === '"') double += 1;
  }
  return single % 2 === 0 && double % 2 === 0;
};

const toJsExpr = (expr: string) =>
  expr
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!')
    .replace(/\blen\s*\(/g, '__len(');

const safeEval = (expr: string, scope: Record<string, unknown>) => {
  const safePattern = /^[\w\s.+\-*/%<>=!,'"()[\],:{}]+$/;
  if (!safePattern.test(expr)) {
    throw new Error('invalid characters');
  }

  const jsExpr = toJsExpr(expr);
  try {
    const fn = new Function(
      '__scope',
      '__len',
      `with (__scope) { return (${jsExpr}); }`
    ) as (scopeArg: Record<string, unknown>, lenFn: (val: unknown) => number) => unknown;
    return fn(scope, (val: unknown) => {
      if (Array.isArray(val) || typeof val === 'string') return val.length;
      if (val && typeof val === 'object') return Object.keys(val as object).length;
      throw new Error('object of type has no len()');
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('is not defined')) {
      const variable = message.split(' ')[0];
      throw new Error(`NameError: name '${variable}' is not defined`);
    }
    throw error;
  }
};

export const normalizePythonCode = (code: string) =>
  code
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n');

export const simulatePython = (code: string): PythonSimulationResult => {
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  const scope: Record<string, unknown> = {};
  const stdout: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const lineNo = i + 1;
    const raw = lines[i];
    const line = raw.trim();

    if (!line || line.startsWith('#')) continue;

    if (!hasBalancedChars(line, '(', ')')) {
      return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'SyntaxError', "unmatched ')'") };
    }
    if (!hasBalancedChars(line, '[', ']') || !hasBalancedChars(line, '{', '}') || !hasBalancedQuotes(line)) {
      return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'SyntaxError', 'invalid syntax') };
    }

    if (line.includes('===')) {
      return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'SyntaxError', 'invalid syntax') };
    }

    if (/^(if|for|while|def|class|try|except|elif|else|finally)\b/.test(line) && !line.endsWith(':')) {
      return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'SyntaxError', "expected ':'") };
    }

    // Allow learning snippets commonly found inside blocks in Python lessons.
    if (/^(return|pass|break|continue)\b/.test(line)) {
      continue;
    }

    if (/^print\s*\(.+\)$/.test(line)) {
      const expr = line.replace(/^print\s*\(/, '').replace(/\)$/, '').trim();
      try {
        const result = safeEval(expr, scope);
        stdout.push(String(result));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.startsWith('NameError:')) {
          return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'NameError', message.replace('NameError: ', '')) };
        }
        return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'RuntimeError', 'evaluation failed') };
      }
      continue;
    }

    if (/^raise\s+ValueError\s*\(.+\)$/.test(line)) {
      return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'ValueError', 'manual exception') };
    }

    const assign = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (assign) {
      const [, variable, expr] = assign;
      try {
        scope[variable] = safeEval(expr, scope);
      } catch {
        scope[variable] = expr;
      }
      continue;
    }

    // Snippets like "if ...:" or "def ...:" are treated as valid learning fragments.
    if (/^(if|for|while|def|class|try|except|elif|else|finally)\b.*:$/.test(line)) {
      continue;
    }

    // Standalone expressions are valid in Python.
    try {
      safeEval(line, scope);
    } catch {
      return { stdout: stdout.join('\n'), stderr: toTraceback(lineNo, 'SyntaxError', 'invalid syntax') };
    }
  }

  return { stdout: stdout.join('\n'), stderr: '' };
};
