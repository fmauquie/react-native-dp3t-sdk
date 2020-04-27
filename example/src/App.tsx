import * as React from 'react';
import { FunctionComponent } from 'react';
import { Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  BackButton,
  DeepLinking,
  NativeRouter,
  Redirect,
  Route,
  Switch,
} from 'react-router-native';
import { Container } from './common';
import { Home, Init, TestPositive } from './home';
import { NotFound } from './navigation';

export default function App() {
  return (
    <SafeAreaProvider>
      <NativeRouter>
        <StatusBar
          translucent
          barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'}
        />
        <BackButton />
        <DeepLinking />
        <Container>
          <Routes />
        </Container>
      </NativeRouter>
    </SafeAreaProvider>
  );
}

const Routes: FunctionComponent = () => {
  return (
    <Switch>
      <Redirect exact from="/" to="/home" />
      <Route path="/home" component={Home} />
      <Route path="/init" component={Init} />
      <Route path="/testPositive" component={TestPositive} />
      <Route component={NotFound} />
    </Switch>
  );
};
