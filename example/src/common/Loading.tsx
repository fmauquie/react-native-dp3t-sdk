import React, { FunctionComponent } from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { Container } from './layout';

export const Loading: FunctionComponent = ({ children }) => (
  <LoadingContainer>
    <ActivityIndicator animating size="large" />
    {children}
  </LoadingContainer>
);

const LoadingContainer = styled(Container)`
  justify-content: center;
  align-items: center;
`;
