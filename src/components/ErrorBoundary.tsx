import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PyLingo runtime error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-boundary">
          <section className="error-boundary-card">
            <p className="brand-kicker">PyLingo</p>
            <h1>Ocurrió un error inesperado</h1>
            <p>Recarga la plataforma para continuar tu aprendizaje.</p>
            <button type="button" className="primary-btn" onClick={() => window.location.reload()}>
              Recargar aplicación
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
