/**
 * Global Error Boundary with Application Insights Integration
 * Catches React errors and reports them to Azure
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import appInsightsService from '../services/appInsightsService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console
    console.error('Error caught by boundary:', error, errorInfo);

    // Track in Application Insights
    appInsightsService.trackException({
      exception: error,
      severityLevel: 3, // Error
      properties: {
        componentStack: errorInfo.componentStack,
        errorBoundary: 'GlobalErrorBoundary',
      },
    });

    // Update state
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.errorBox}>
            <h1 style={styles.title}>🚨 Game Error</h1>
            <p style={styles.message}>
              Something went wrong. The error has been reported.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Error Details (Dev Only)</summary>
                <pre style={styles.stack}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <button
              onClick={this.handleReset}
              style={styles.button}
            >
              🔄 Reload Game
            </button>

            <button
              onClick={() => window.location.href = '/'}
              style={{...styles.button, ...styles.buttonSecondary}}
            >
              🏠 Return to Menu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '20px',
  },
  errorBox: {
    background: 'rgba(255, 0, 0, 0.1)',
    border: '3px solid #f00',
    borderRadius: '16px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 0 40px rgba(255, 0, 0, 0.5)',
  },
  title: {
    color: '#f00',
    fontSize: '32px',
    marginBottom: '20px',
    textShadow: '0 0 10px #f00',
  },
  message: {
    color: '#fff',
    fontSize: '18px',
    marginBottom: '30px',
    lineHeight: 1.6,
  },
  details: {
    textAlign: 'left',
    marginBottom: '30px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '16px',
  },
  summary: {
    color: '#0ff',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  stack: {
    color: '#ff8888',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  button: {
    padding: '12px 32px',
    margin: '8px',
    background: '#f00',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  buttonSecondary: {
    background: '#0ff',
    color: '#000',
  },
};

export default ErrorBoundary;
