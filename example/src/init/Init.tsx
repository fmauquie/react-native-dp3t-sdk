import React, { FunctionComponent, useCallback, useState } from 'react';
import { Button, Text } from 'react-native';
import { initManually, initWithDiscovery } from 'react-native-dp3t';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Route, RouteComponentProps, Switch } from 'react-router';
import {
  Divider,
  Header,
  HeaderLeft,
  HeaderMiddle,
  HeaderRight,
  InputContainer,
  InputLabel,
  ListItem,
  SafeContainer,
  ScrollContainer,
  ShortDivider,
  StyledInput,
  TouchableRipple,
} from '../common';
import { goRoot, NotFound } from '../navigation';
import { Backend, usePreviousBackends } from './usePreviousBackends';

export const Init: FunctionComponent<RouteComponentProps> = ({
  match,
  history,
}) => {
  const [previousBackends, addBackend] = usePreviousBackends();
  const [error, setError] = useState<Error | null>(null);
  const [manualBackendAppId, setManualBackendAppId] = useState('');
  const [manualBackendBaseUrl, setManualBackendBaseUrl] = useState('');
  const [manualBucketBaseUrl, setManualBucketBaseUrl] = useState('');

  const connectBackend = useCallback(
    async function connectBackend(backend: Backend) {
      try {
        if (backend.type === 'manual') {
          await initManually(
            backend.backendAppId,
            backend.backendBaseUrl,
            backend.bucketBaseUrl
          );
        } else {
          await initWithDiscovery(backend.backendAppId, false);
        }
        await addBackend(backend);
        goRoot(history, '/home');
      } catch (e) {
        setError(e);
      }
    },
    [addBackend, history]
  );

  if (error) {
    return (
      <SafeContainer>
        <Header>
          <HeaderLeft />
          <HeaderMiddle>
            <Text>Error</Text>
          </HeaderMiddle>
          <HeaderRight>
            <TouchableRipple
              borderless
              useForeground
              hitSlop={{ top: 20, left: 20, bottom: 20, right: 20 }}
              onPress={() => setError(null)}
            >
              <Icon name="clear" color="black" size={20} />
            </TouchableRipple>
          </HeaderRight>
        </Header>
        <ScrollContainer>
          <Text>Error: {error.name}</Text>
          <Text>{error.message}</Text>
          <Text>{JSON.stringify(error)}</Text>
        </ScrollContainer>
      </SafeContainer>
    );
  }

  return (
    <Switch>
      <Route
        path={match.path}
        render={() => (
          <SafeContainer>
            <Header>
              <HeaderLeft />
              <HeaderMiddle>
                <Text>Choose backend</Text>
              </HeaderMiddle>
              <HeaderRight />
            </Header>
            <ShortDivider />
            <ScrollContainer>
              {!(previousBackends instanceof Error) &&
                previousBackends.length > 0 && (
                  <>
                    <Text>Previous</Text>
                    {previousBackends.map((backend, i) => (
                      <TouchableRipple
                        key={i}
                        onPress={() => connectBackend(backend)}
                      >
                        <ListItem>
                          <Text>
                            {backend.backendAppId} (
                            {backend.type === 'manual'
                              ? `manual on ${backend.backendBaseUrl}`
                              : `discover ${backend.dev ? 'dev' : 'prod'}`}
                            )
                          </Text>
                        </ListItem>
                      </TouchableRipple>
                    ))}
                    <Divider />
                  </>
                )}
              <Text>Discover</Text>
              <TouchableRipple
                onPress={() =>
                  connectBackend({
                    type: 'discover',
                    backendAppId: 'org.dpppt.demo',
                    dev: false,
                  })
                }
              >
                <ListItem>
                  <Text>org.dpppt.demo (prod)</Text>
                </ListItem>
              </TouchableRipple>
              <TouchableRipple
                onPress={() =>
                  connectBackend({
                    type: 'discover',
                    backendAppId: 'org.dpppt.demo',
                    dev: true,
                  })
                }
              >
                <ListItem>
                  <Text>org.dpppt.demo (dev)</Text>
                </ListItem>
              </TouchableRipple>
              <Divider />
              <Text>Manual</Text>
              <ListItem>
                <InputContainer>
                  <InputLabel>ID:</InputLabel>
                  <StyledInput
                    value={manualBackendAppId}
                    onChangeText={setManualBackendAppId}
                  />
                </InputContainer>
                <InputContainer>
                  <InputLabel>Base/Report URL:</InputLabel>
                  <StyledInput
                    value={manualBackendBaseUrl}
                    onChangeText={setManualBackendBaseUrl}
                  />
                </InputContainer>
                <InputContainer>
                  <InputLabel>Bucket URL:</InputLabel>
                  <StyledInput
                    value={manualBucketBaseUrl}
                    onChangeText={setManualBucketBaseUrl}
                  />
                </InputContainer>
                <Button
                  onPress={() =>
                    connectBackend({
                      type: 'manual',
                      backendAppId: manualBackendAppId,
                      backendBaseUrl: manualBackendBaseUrl,
                      bucketBaseUrl: manualBucketBaseUrl,
                    })
                  }
                  title="Connect"
                />
              </ListItem>
            </ScrollContainer>
          </SafeContainer>
        )}
      />
      <Route component={NotFound} />
    </Switch>
  );
};
