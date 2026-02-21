interface Props {
  status: 'idle' | 'success' | 'error';
  hint?: string;
  adrenalineMessage?: string;
  onCheck: () => void;
  onNext: () => void;
  questionIndex: number;
  totalQuestions: number;
}

export const FeedbackBanner = ({
  status,
  hint,
  adrenalineMessage,
  onCheck,
  onNext,
  questionIndex,
  totalQuestions
}: Props) => {
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <footer className={`feedback ${isSuccess ? 'success' : isError ? 'error' : 'idle'}`}>
      <div className="feedback-inner">
        <div className="feedback-text">
          <p className="question-meta">
            Pregunta {questionIndex}/{totalQuestions}
          </p>

          {isSuccess && (
            <div className="feedback-pop">
              <h3>Correcto</h3>
              <p>Buena practica. Sigue con la siguiente.</p>
            </div>
          )}

          {isError && (
            <div>
              <h3>Revisa</h3>
              <p>{hint}</p>
            </div>
          )}

          {status === 'idle' && (
            <div>
              <h3>Tip practico</h3>
              <p>{adrenalineMessage || 'Piensa en un caso real: ecommerce, login, inventario o reportes.'}</p>
            </div>
          )}

          {adrenalineMessage && status !== 'idle' && <p className="feedback-adrenaline">{adrenalineMessage}</p>}
        </div>

        <button
          type="button"
          onClick={isSuccess ? onNext : onCheck}
          className={`duo-button feedback-btn ${isError ? 'error-button' : ''}`}
        >
          {isSuccess ? 'Continuar' : 'Comprobar'}
        </button>
      </div>
    </footer>
  );
};
