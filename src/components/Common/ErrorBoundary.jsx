import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Box, VStack, Text, Button } from '../core';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Componente falhou:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box 
          p="xxl" 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          height="100%" 
          style={{ minHeight: '300px' }}
        >
          <VStack gap="lg" alignItems="center" maxWidth="450px" textAlign="center">
            <Box p="md" borderRadius="full" bg="rgba(239, 68, 68, 0.1)" style={{ color: 'var(--danger-color)' }}>
              <AlertCircle size={48} />
            </Box>
            <VStack gap="xs">
              <Text size="xl" weight="800">Ops! Algo deu errado.</Text>
              <Text color="textMuted">
                Ocorreu um erro inesperado ao carregar este componente. Isso pode ser devido a filtros de rede ou dados inconsistentes.
              </Text>
            </VStack>
            <Button onClick={this.handleReset} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw size={16} />
              Tentar Novamente
            </Button>
            {process.env.NODE_ENV === 'development' && (
              <Box 
                mt="md" 
                p="md" 
                bg="surface" 
                border 
                borderRadius="md" 
                style={{ width: '100%', overflow: 'auto', textAlign: 'left' }}
              >
                <Text size="xs" color="danger" style={{ fontFamily: 'monospace' }}>
                  {this.state.error?.toString()}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
