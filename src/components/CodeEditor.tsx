interface Props {
  value: string;
  onChange: (val: string) => void;
  onEnter: () => void;
  isError: boolean;
  starterCode: string;
}

const pyKeywords = new Set([
  'def',
  'class',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'return',
  'import',
  'from',
  'as',
  'try',
  'except',
  'finally',
  'raise',
  'in',
  'and',
  'or',
  'not',
  'True',
  'False',
  'None'
]);

const tokenClass = (token: string) => {
  if (!token) return '';
  if (/^\s+$/.test(token)) return '';
  if (token.startsWith('#')) return 'tok-comment';
  if (/^'.*'$|^".*"$/.test(token)) return 'tok-string';
  if (/^\d+(\.\d+)?$/.test(token)) return 'tok-number';
  if (pyKeywords.has(token)) return 'tok-keyword';
  if (/^(==|!=|<=|>=|=|:|\(|\)|\[|\]|\{|\}|,|\+|-|\*|\/|%)$/.test(token)) return 'tok-operator';
  return 'tok-ident';
};

const highlightLine = (line: string) => {
  if (line.trim().startsWith('#')) {
    return [{ value: line, className: 'tok-comment' }];
  }

  const tokens =
    line.match(
      /(".*?"|'.*?'|\b(?:def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|in|and|or|not|True|False|None)\b|\b\d+(?:\.\d+)?\b|==|!=|<=|>=|=|:|\(|\)|\[|\]|\{|\}|,|\+|-|\*|\/|%|[A-Za-z_]\w*|\s+|.)/g
    ) ?? [line];

  return tokens.map((value) => ({ value, className: tokenClass(value) }));
};

export const CodeEditor = ({ value, onChange, onEnter, isError, starterCode }: Props) => {
  const hasStarterTemplate = Boolean(starterCode && value.trim().length > 0);
  return (
    <div className={`code-editor ${isError ? 'animate-shake' : ''}`}>
      <div className="editor-bar">
        <div className="dot red" />
        <div className="dot yellow" />
        <div className="dot green" />
        <span className="editor-file">practice.py</span>
      </div>

      <div className="editor-row">
        <span className="editor-kw">
          {hasStarterTemplate
            ? '# modifica el bloque base y completa el TODO'
            : '# escribe una solucion valida en Python'}
        </span>
      </div>

      {starterCode && (
        <pre className="code-example" aria-label="Codigo de ejemplo">
          {starterCode.split('\n').map((line, lineIdx) => (
            <div key={`example-line-${lineIdx}`} className="code-example-line">
              <span className="code-example-ln">{lineIdx + 1}</span>
              <span className="code-example-content">
                {highlightLine(line).map((token, tokenIdx) => (
                  <span key={`tok-${lineIdx}-${tokenIdx}`} className={token.className}>
                    {token.value}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}

      <div className="editor-input-wrap">
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              onEnter();
            }
          }}
          className="editor-input"
          placeholder={
            hasStarterTemplate
              ? 'modifica el bloque y reemplaza el TODO (Ctrl+Enter para comprobar)'
              : 'escribe tu respuesta (Ctrl+Enter para comprobar)'
          }
          spellCheck={false}
          rows={7}
        />
      </div>
    </div>
  );
};
