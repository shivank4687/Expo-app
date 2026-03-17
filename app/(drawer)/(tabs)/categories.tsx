import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { CategoryList } from '@/features/home/components/CategoryList';
import { theme } from '@/theme';

export default function CategoriesTab() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen
        options={{
          title: t('category.categories'),
          headerBackTitle: t('common.back'),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <CategoryList />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
  },
});
