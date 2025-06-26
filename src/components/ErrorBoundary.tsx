import React from "react";

import { logger } from '../lib/utils';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown, info: unknown) {
    // Log error
    logger.error("DynamicForm error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong rendering the form.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 