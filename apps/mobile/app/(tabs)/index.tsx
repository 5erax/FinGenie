import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>FinGenie</Text>
        <Text style={styles.subtitle}>Welcome to FinGenie</Text>
        <Text style={styles.description}>
          Your AI-powered personal finance assistant
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#a1a1aa',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#52525b',
    textAlign: 'center',
    lineHeight: 22,
  },
});
