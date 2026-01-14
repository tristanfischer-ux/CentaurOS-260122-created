import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global error boundary to catch and display React errors
 * Prevents app crashes and provides user-friendly error UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Silent error capture - avoid console.error to prevent infinite loops
    // Error details are stored in state and displayed in dev mode
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-white dark:bg-slate-950 items-center justify-center p-6">
          <View className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 max-w-md">
            <View className="items-center mb-4">
              <AlertTriangle size={48} color="#ef4444" />
              <Text className="text-red-400 text-xl font-bold mt-4 mb-2">
                Something went wrong
              </Text>
              <Text className="text-gray-600 dark:text-slate-400 text-center text-sm">
                We've encountered an unexpected error. Don't worry, your data is safe.
              </Text>
            </View>

            {__DEV__ && this.state.error && (
              <ScrollView className="bg-gray-100 dark:bg-slate-900 rounded-lg p-3 mb-4 max-h-40">
                <Text className="text-red-400 text-xs font-mono">
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text className="text-gray-600 dark:text-slate-400 text-xs font-mono mt-2">
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}

            <Pressable
              onPress={this.handleReset}
              className="bg-blue-500 rounded-xl p-4 flex-row items-center justify-center active:opacity-70"
            >
              <RefreshCw size={20} color="white" />
              <Text className="text-white font-semibold ml-2">
                Try Again
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}
