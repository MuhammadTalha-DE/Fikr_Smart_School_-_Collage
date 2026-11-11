import { Component } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Home, RefreshCw } from 'lucide-react';

const getUserHomePath = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role ? `/${user.role}/dashboard` : '/login';
  } catch {
    return '/login';
  }
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
      });
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    console.error('[ErrorBoundary] Caught an error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);

    try {
      if (import.meta.env.PROD) {
        const errorPayload = {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo?.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };

        fetch('/api/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'frontend_error',
            details: errorPayload,
            severity: 'error',
          }),
        }).catch(() => {});
      }
    } catch {
      // Ignore monitoring failures so the fallback UI stays stable.
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = getUserHomePath();
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error } = this.state;
    const fallbackMessage = this.props.fallbackMessage || 'An unexpected error occurred. Please try reloading the page.';

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-red-50 p-4 sm:p-8">
        <div className="max-w-lg w-full text-center">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mb-6 shadow-lg shadow-red-100/50">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>

          <div className="text-7xl font-black text-red-200 mb-2">500</div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {this.props.title || 'Something went wrong'}
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            {fallbackMessage}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 w-full sm:w-auto justify-center"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all w-full sm:w-auto justify-center"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          </div>

          {(import.meta.env.DEV || this.props.showDevDetails) && error && (
            <div className="text-left">
              <button
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {this.state.showDetails ? 'Hide' : 'Show'} error details
              </button>

              {this.state.showDetails && (
                <div className="mt-4 space-y-2">
                  <div className="p-4 bg-gray-900 text-red-300 rounded-2xl text-xs font-mono overflow-auto max-h-64 leading-relaxed">
                    <div className="text-gray-400 mb-2">Error Message</div>
                    <div className="text-red-300 mb-3">{error.toString()}</div>

                    {this.state.errorInfo?.componentStack && (
                      <>
                        <div className="text-gray-400 mt-3 mb-2">Component Stack</div>
                        <div className="text-yellow-300 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </div>
                      </>
                    )}

                    {error.stack && (
                      <>
                        <div className="text-gray-400 mt-3 mb-2">Call Stack</div>
                        <div className="text-blue-300 whitespace-pre-wrap">
                          {error.stack}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
