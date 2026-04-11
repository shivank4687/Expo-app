import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Category } from '@/services/api/categories.api';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

const CATEGORY_IMAGE_SIZE = 64;
const SIDEBAR_WIDTH = 120;

const CategoryImage: React.FC<{ imageUrl?: string }> = ({ imageUrl }) => {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={styles.parentImage}
        resizeMode="cover"
      />
    );
  }

  return <Ionicons name="grid-outline" size={34} color={theme.colors.gray[400]} />;
};

const ThirdLevelItem: React.FC<{ item: Category; onPress: (id: number, name: string) => void }> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.thirdLevelItem} onPress={() => onPress(item.id, item.name)} activeOpacity={0.7}>
    <View style={styles.thirdLevelIconContainer}>
      <CategoryImage imageUrl={item.image} />
    </View>
    <Text style={styles.thirdLevelName} numberOfLines={2}>
      {item.name}
    </Text>
  </TouchableOpacity>
);

const SectionRow: React.FC<{ category: Category; onPress: (id: number, name: string) => void }> = ({ category, onPress }) => {
  const items: Category[] = category.children && category.children.length > 0 ? category.children : [category];

  return (
    <View style={styles.sectionRow}>
      <TouchableOpacity style={styles.sectionHeader} onPress={() => onPress(category.id, category.name)} activeOpacity={0.7}>
        <Text style={styles.sectionTitle}>{category.name}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
      </TouchableOpacity>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ThirdLevelItem item={item} onPress={onPress} />}
        contentContainerStyle={styles.sectionCarousel}
      />
    </View>
  );
};

export default function CategoriesTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { categories, isLoading } = useAppSelector((state) => state.category);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

  const selectedParent = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    if (selectedParentId) {
      return categories.find((category) => category.id === selectedParentId) || categories[0];
    }
    return categories[0];
  }, [categories, selectedParentId]);

  useEffect(() => {
    if (!selectedParentId && categories.length > 0) {
      setSelectedParentId(categories[0].id);
    }
  }, [categories, selectedParentId]);

  const handleParentSelect = (categoryId: number) => {
    setSelectedParentId(categoryId);
  };

  const handleCategoryPress = (categoryId: number, categoryName: string) => {
    router.push(`/category/${categoryId}?name=${encodeURIComponent(categoryName)}` as any);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: t('category.categories'),
          headerBackTitle: t('common.back'),
        }}
      />
      {isLoading && categories.length === 0 ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      ) : (
        <View style={styles.container}>
          {/* Top Parent Categories Navigation */}
          <View style={styles.topNavContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topNavContent}
            >
              {categories.map((category) => {
                const isSelected = category.id === selectedParent?.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.parentTab, isSelected && styles.parentTabSelected]}
                    onPress={() => handleParentSelect(category.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.parentTabText, isSelected && styles.parentTabTextSelected]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Left Sidebar (Commented Out) */}
          {/* 
          <View style={styles.sidebar}>
            <ScrollView contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
              {categories.map((category) => {
                const isSelected = category.id === selectedParent?.id;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.parentTile, isSelected && styles.parentTileSelected]}
                    onPress={() => handleParentSelect(category.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.parentImageWrapper}>
                      <CategoryImage imageUrl={category.image} />
                    </View>
                    <Text style={styles.parentName} numberOfLines={2}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
          */}

          <ScrollView style={styles.detailPane} contentContainerStyle={styles.detailContent}>
            {selectedParent?.children && selectedParent.children.length > 0 ? (
              selectedParent.children.map((child) => (
                <SectionRow key={child.id} category={child} onPress={handleCategoryPress} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('category.noSubcategories', 'No subcategories yet.')}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  topNavContainer: {
    backgroundColor: theme.colors.background.default,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
    paddingVertical: theme.spacing.sm,
  },
  topNavContent: {
    paddingHorizontal: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentTab: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    // marginRight: theme.spacing.xxs,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  parentTabSelected: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  parentTabText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  parentTabTextSelected: {
    color: theme.colors.primary[600],
    fontWeight: theme.typography.fontWeight.bold,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: theme.colors.background.secondary,
    borderRightWidth: 1,
    borderRightColor: theme.colors.gray[200],
  },
  sidebarContent: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  parentTile: {
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.spacing.sm,
    justifyContent: 'space-between',
    height: CATEGORY_IMAGE_SIZE + 48,
  },
  parentTileSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  parentImageWrapper: {
    width: CATEGORY_IMAGE_SIZE,
    height: CATEGORY_IMAGE_SIZE,
    borderRadius: CATEGORY_IMAGE_SIZE / 2,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  parentImage: {
    width: CATEGORY_IMAGE_SIZE,
    height: CATEGORY_IMAGE_SIZE,
    borderRadius: CATEGORY_IMAGE_SIZE / 2,
  },
  parentName: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  detailPane: {
    flex: 1,
  },
  detailContent: {
    padding: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  sectionRow: {
    marginBottom: theme.spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  sectionCarousel: {
    paddingRight: theme.spacing.md,
  },
  thirdLevelItem: {
    width: 90,
    marginRight: theme.spacing.lg,
    alignItems: 'center',
  },
  thirdLevelIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  thirdLevelName: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
  },
  emptyState: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
