import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Something went wrong.</h1>
            <p className="mt-2 text-gray-600">Please try refreshing the page.</p>
          </div>
        </div>
      );
    }

    return (this.props as any).children;
  }
}
