import { ActivityIndicator, StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export function OnboardingReadingTestGateLoading() {
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color="#2C8C55" />
    </View>
  );
}
