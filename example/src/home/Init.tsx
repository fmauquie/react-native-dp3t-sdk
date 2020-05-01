import React, { FunctionComponent, useCallback, useState } from 'react';
import { Button, Text } from 'react-native';
import { initManually, initWithDiscovery } from 'react-native-dp3t-sdk';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useHistory } from 'react-router';
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
import { goRoot } from '../navigation';
import { Backend, usePreviousBackends } from './usePreviousBackends';

export const Init: FunctionComponent = () => {
  const history = useHistory();
  const [previousBackends, addBackend] = usePreviousBackends();
  const [error, setError] = useState<Error | null>(null);
  const [manualBackendAppId, setManualBackendAppId] = useState('');
  const [manualReportBaseUrl, setManualReportBaseUrl] = useState('');
  const [manualBucketBaseUrl, setManualBucketBaseUrl] = useState('');
  const [manualPublicKeyBase64, setManualPublicKeyBase64] = useState('');

  const connectBackend = useCallback(
    async function connectBackend(backend: Backend) {
      try {
        if (backend.type === 'manual') {
          await initManually(
            backend.backendAppId,
            backend.backendBaseUrl,
            backend.bucketBaseUrl,
            backend.publicKeyBase64
          );
        } else {
          await initWithDiscovery(
            backend.backendAppId,
            backend.publicKeyBase64,
            backend.dev
          );
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
        {!(previousBackends instanceof Error) && previousBackends.length > 0 && (
          <>
            <Text>Previous</Text>
            {previousBackends.map((backend, i) => (
              <TouchableRipple key={i} onPress={() => connectBackend(backend)}>
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
              publicKeyBase64:
                'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0R' +
                'RZ0FFSndKMkErS2taR0p6QlMzM3dEOUUyaEI1K3VNYgpZcitNU2pOUGhmYzR6Q2w2amdSWkFWVHBKbE' +
                '0wSmI4RERqcDNRUDZhK2VEK1I1SFYyNzhROVN0SUhnPT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t',
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
              publicKeyBase64:
                'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUZrd0V3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0R' +
                'RZ0FFSndKMkErS2taR0p6QlMzM3dEOUUyaEI1K3VNYgpZcitNU2pOUGhmYzR6Q2w2amdSWkFWVHBKbE' +
                '0wSmI4RERqcDNRUDZhK2VEK1I1SFYyNzhROVN0SUhnPT0KLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0t',
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
            <InputLabel>Report Base URL:</InputLabel>
            <StyledInput
              value={manualReportBaseUrl}
              onChangeText={setManualReportBaseUrl}
            />
          </InputContainer>
          <InputContainer>
            <InputLabel>Bucket Base URL:</InputLabel>
            <StyledInput
              value={manualBucketBaseUrl}
              onChangeText={setManualBucketBaseUrl}
            />
          </InputContainer>
          <InputContainer>
            <InputLabel>Public key in Base64:</InputLabel>
            <StyledInput
              value={manualPublicKeyBase64}
              onChangeText={setManualPublicKeyBase64}
            />
          </InputContainer>
          <Button
            onPress={() =>
              connectBackend({
                type: 'manual',
                backendAppId: manualBackendAppId,
                backendBaseUrl: manualReportBaseUrl,
                bucketBaseUrl: manualBucketBaseUrl,
                publicKeyBase64: manualPublicKeyBase64,
              })
            }
            title="Connect"
          />
        </ListItem>
      </ScrollContainer>
    </SafeContainer>
  );
};
