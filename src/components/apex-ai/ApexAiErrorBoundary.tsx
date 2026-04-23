import { Component, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ApexAiErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface ApexAiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * ApexAiErrorBoundary — Apex AI-specific error boundary.
 *
 * Differences from the generic ErrorBoundary:
 *   - Branded visual (emerald/orange instead of red-only)
 *   - Specific copy for trading feature ("bot paused safely")
 *   - Reset button that clears state and re-renders children
 *   - Tracks error count to decide whether to suggest going home
 *
 * Wrap around the root of each Apex AI page (or the entire Apex AI route
 * group) to contain crashes without taking down the whole app.
 */
export class ApexAiErrorBoundary extends Component<
  ApexAiErrorBoundaryProps,
  ApexAiErrorBoundaryState
> {
  constructor(props: ApexAiErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ApexAiErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }): void {
    if (import.meta.env.DEV) {
      console.error('[ApexAiErrorBoundary] caught', {
        error: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
      });
    }
  }

  reset = (): void => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorCount: prev.errorCount + 1,
    }));
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const title = this.props.fallbackTitle ?? 'Apex AI hit a snag';
    const description =
      this.props.fallbackDescription ??
      "Your bot and funds are safe — this was only a UI error. No trades were affected.";

    const tooManyErrors = this.state.errorCount >= 3;

    return (
      <div className="min-h-screen bg-background px-5 py-10 flex items-center justify-center">
        <Card className="w-full max-w-md border-orange-500/30 bg-orange-500/5">
          <CardContent className="p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mx-auto shadow-lg">
              <AlertTriangle className="w-7 h-7 text-white" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
              {this.state.error?.message && import.meta.env.DEV && (
                <pre className="text-xs text-muted-foreground bg-black/30 p-2 rounded overflow-x-auto mt-3 text-left">
                  {this.state.error.message}
                </pre>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {!tooManyErrors ? (
                <Button
                  onClick={this.reset}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
              ) : (
                <Button
                  onClick={() => (window.location.href = '/home')}
                  variant="outline"
                >
                  Back to home
                </Button>
              )}

              {!tooManyErrors && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = '/home')}
                  className="text-xs text-muted-foreground"
                >
                  Back to home instead
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
