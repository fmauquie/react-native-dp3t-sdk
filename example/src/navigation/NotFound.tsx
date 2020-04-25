import React from 'react';
import { Text } from 'react-native';
import { RouteComponentProps } from 'react-router';
import { SafeContainer } from '../common';

export const NotFound: React.FC<RouteComponentProps> = ({ location }) => {
  return (
    <SafeContainer>
      <Text>Screen {location.pathname} does not exist</Text>
    </SafeContainer>
  );
};
