import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useDp3tStatusUpdates } from 'react-native-dp3t';

export default function App() {
  const status = useDp3tStatusUpdates();

  return (
    <View style={styles.container}>
      <Text>
        DP3T Status:{' '}
        {status instanceof Error ? (
          <>Error: {status.message}</>
        ) : (
          JSON.stringify(status, null, 2)
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
