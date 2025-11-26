import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { theme } from '@/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal Screen</Text>
      <Text style={styles.text}>This is a placeholder modal screen.</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.default,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  link: {
    marginTop: theme.spacing.md,
  },
  linkText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semiBold,
  },
});
