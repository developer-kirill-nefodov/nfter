import {Component, type ErrorInfo, type ReactNode} from 'react';

import {Card, Stack, Subtitle, Title} from '../../styles';
import Button from '../Button';

interface IProps {
  children: ReactNode;
}

interface IState {
  error: Error | null;
}

/**
 * Without this, a single render throw — a malformed API payload reaching
 * `user.role.name`, say — white-screens the entire app with no way back.
 */
class ErrorBoundary extends Component<IProps, IState> {
  state: IState = {error: null};

  static getDerivedStateFromError(error: Error): IState {
    return {error};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Where a real deployment would call Sentry.
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    const {error} = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <Card role="alert" style={{margin: '64px auto', maxWidth: 480}}>
        <Stack>
          <Title>Something broke</Title>
          <Subtitle>{error.message}</Subtitle>
          <Button onClick={() => window.location.assign('/')}>Back to safety</Button>
        </Stack>
      </Card>
    );
  }
}

export default ErrorBoundary;
