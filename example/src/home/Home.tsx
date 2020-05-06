import React, { FunctionComponent, useState } from 'react';
import { Button, Text } from 'react-native';
import {
  requestPermissions,
  start,
  stop,
  sync,
  useDp3tStatus,
} from 'react-native-dp3t-sdk';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Link } from 'react-router-native';
import styled from 'styled-components/native';
import {
  Divider,
  Header,
  HeaderLeft,
  HeaderMiddle,
  HeaderRight,
  HorizontalContainer,
  ListItem,
  Loading,
  LongDate,
  SafeContainer,
  ScrollContainer,
  TouchableRipple,
} from '../common';

export const Home: FunctionComponent = () => {
  const [status, refreshStatus] = useDp3tStatus();
  const [error, setError] = useState<Error | null>(null);

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

  if (status === null) {
    return (
      <SafeContainer>
        <Loading />
        <ListItem>
          <Button title="Refresh status" onPress={refreshStatus} />
        </ListItem>
      </SafeContainer>
    );
  }

  if (status === false) {
    return (
      <SafeContainer>
        <ScrollContainer>
          <Text>DP3T not initialized.</Text>
          <ListItem>
            <Link
              to="/init"
              component={Button}
              title="Initialize with a backend"
            />
          </ListItem>
        </ScrollContainer>
      </SafeContainer>
    );
  }

  if (status instanceof Error) {
    return (
      <SafeContainer>
        <ScrollContainer>
          <Text>DP3T status error: {status.message}</Text>
          <ListItem>
            <Button title="Refresh status" onPress={refreshStatus} />
          </ListItem>
        </ScrollContainer>
      </SafeContainer>
    );
  }

  return (
    <SafeContainer>
      <ScrollContainer>
        {status.tracingState === 'error' && (
          <>
            {status.errors.includes('permissionMissing') && (
              <ListItem>
                <Text>Missing permissions</Text>
                <Button
                  title="Request permissions"
                  onPress={async () => {
                    const permission = await requestPermissions();

                    if (permission && permission === 'granted') {
                      refreshStatus();
                    }
                  }}
                />
              </ListItem>
            )}
            {status.errors.includes('bluetoothDisabled') && (
              <ListItem>
                <Text>
                  Bluetooth disabled. Enable it and refresh status below.
                </Text>
              </ListItem>
            )}
            {status.errors.includes('sync') && (
              <ListItem>
                <Text>Synchronization error.</Text>
              </ListItem>
            )}
            {status.errors.includes('other') && (
              <ListItem>
                <Text>Unknown error.</Text>
              </ListItem>
            )}
          </>
        )}
        {status.tracingState === 'stopped' && (
          <ListItem>
            <Text>Tracing stopped</Text>
            <Button title="Start tracing" onPress={() => start()} />
          </ListItem>
        )}
        {status.tracingState === 'started' && (
          <ListItem>
            <Text>Tracing started</Text>
            <Button title="Stop tracing" onPress={() => stop()} />
          </ListItem>
        )}
        <Divider />
        {status.healthStatus === 'healthy' && (
          <ListItem>
            <Healthy>Healthy</Healthy>
          </ListItem>
        )}
        {status.healthStatus === 'exposed' && (
          <>
            <ListItem>
              <Exposed>Exposed</Exposed>
            </ListItem>
            {status.exposedDays.map(({ id, exposedDate, reportDate }) => (
              <HorizontalContainer key={id}>
                <Column>
                  <Text>Exposed since</Text>
                  <LongDate date={exposedDate} />
                </Column>
                <Column>
                  <Text>Reported on</Text>
                  <LongDate date={reportDate} />
                </Column>
              </HorizontalContainer>
            ))}
          </>
        )}
        {status.healthStatus === 'infected' && (
          <ListItem>
            <TestedPositive>I Am Infected (tested positive)</TestedPositive>
          </ListItem>
        )}
        {status.healthStatus !== 'infected' && (
          <ListItem>
            <Link
              to="/testPositive"
              component={Button}
              title="I am infected (tested positive)"
            />
          </ListItem>
        )}
        {status.nativeStatusArg && (
          <ListItem>
            <Text>{JSON.stringify(status.nativeStatusArg)}</Text>
          </ListItem>
        )}
        <Divider />
        <ListItem>
          <Text>{status.numberOfHandshakes} handshakes with other phones</Text>
        </ListItem>
        <ListItem>
          <Text>
            {status.numberOfContacts} contacts with other people (updated on
            sync)
          </Text>
        </ListItem>
        <Divider />
        <ListItem>
          <Button
            title="Force a sync"
            onPress={async () => {
              try {
                await sync();
              } catch (e) {
                setError(e);
              } finally {
                refreshStatus();
              }
            }}
          />
        </ListItem>
        <Divider />
        <ListItem>
          <Text>Status:</Text>
          <Text>{JSON.stringify(status)}</Text>
          <Button title="Refresh status" onPress={refreshStatus} />
        </ListItem>
      </ScrollContainer>
    </SafeContainer>
  );
};

const Healthy = styled.Text`
  color: green;
`;

const Exposed = styled.Text`
  color: orange;
`;

const TestedPositive = styled.Text`
  color: red;
`;

const Column = styled.View`
  flex: 1;
`;
