import { format, parse } from 'date-fns';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { Button, Text } from 'react-native';
import { sendIAmInfected } from 'react-native-dp3t';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useHistory } from 'react-router';
import {
  Header,
  HeaderLeft,
  HeaderMiddle,
  HeaderRight,
  InputContainer,
  InputLabel,
  KeyboardAvoidingContainer,
  ListItem,
  SafeContainer,
  ScrollContainer,
  ShortDivider,
  StyledInput,
  TouchableRipple,
} from '../common';
import { GoBackButton, goRoot } from '../navigation';

export const TestPositive: FunctionComponent = () => {
  const history = useHistory();

  const [onset, setOnset] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [authString, setAuthString] = useState<string>('');

  const [error, setError] = useState<Error | null>(null);

  const send = useCallback(
    async function send() {
      try {
        if (!onset || !authString) {
          throw new Error('Missing onset or auth string');
        }
        const onsetDate = parse(onset, 'yyyy-MM-dd', new Date());
        if (isNaN(onsetDate.getTime())) {
          throw new Error('Invalid onset date');
        }
        await sendIAmInfected(new Date(onset), authString);
        goRoot(history, '/home');
      } catch (e) {
        setError(e);
      }
    },
    [onset, authString, history]
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
        <HeaderLeft>
          <GoBackButton />
        </HeaderLeft>
        <HeaderMiddle>
          <Text>Declare I Am Infected</Text>
        </HeaderMiddle>
        <HeaderRight />
      </Header>
      <ShortDivider />
      <KeyboardAvoidingContainer>
        <ScrollContainer>
          <ListItem>
            <Text>
              So you have been infected and tested positive. What next ?
            </Text>
          </ListItem>
          <ListItem>
            <Text>
              You are going to answer two very short questions below and hit
              "Send".
            </Text>
            <Text>
              This will send the keys you have been emitting to a central
              authority in an anonymous manner.
            </Text>
            <Text>
              The people you have been in contact with will download those keys,
              match them to the keys they got from you, and will be warned that
              they have been exposed.
            </Text>
            <Text>
              You will notice that we did not require your name. The code your
              doctor gave you (on a real app this will certainly be a QR code,
              or deep link from a mail, or whatever, as there are JWT auth and
              stuff in preparation in the SDKs) does not contain or link to your
              identity either. If you suspect they do, run ! This protocol is
              supposed to respect your privacy.
            </Text>
          </ListItem>
          <ListItem>
            <Text>When were you tested positive ?</Text>
            <InputContainer>
              <InputLabel>Date (yyyy-mm-dd):</InputLabel>
              <StyledInput value={onset} onChangeText={setOnset} />
            </InputContainer>
            <Text>Your doctor gave you a code: enter it here</Text>
            <InputContainer>
              <InputLabel>Auth code:</InputLabel>
              <StyledInput value={authString} onChangeText={setAuthString} />
            </InputContainer>
            <Button onPress={send} title="Send" />
          </ListItem>
        </ScrollContainer>
      </KeyboardAvoidingContainer>
    </SafeContainer>
  );
};
