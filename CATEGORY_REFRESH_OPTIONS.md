# Category Refresh Options

You mentioned categories are loading from cache on app reload. Here are your options:

## Current Behavior (Default)

✅ **Categories load instantly from cache**

**Pros:**
- Instant loading (no waiting for API)
- Works offline
- Better UX (no loading spinner)
- Saves bandwidth

**When it refreshes:**
- When user changes locale
- When cache is manually cleared

---

## Option 1: Keep Current Behavior (Recommended)

**Do nothing** - This is the best UX for most apps!

Users see content immediately, then data refreshes when:
- They change language
- New app version clears cache
- They manually refresh (if you add pull-to-refresh)

---

## Option 2: Force Refresh on App Start

If you want fresh data every time the app starts:

### Add to `app/_layout.tsx`:

```typescript
import { fetchCategories } from "@/store/slices/categorySlice";
import { useAppSelector } from "@/store/hooks";

function AppContent() {
  const dispatch = useAppDispatch();
  const { selectedLocale } = useAppSelector(state => state.core);

  useEffect(() => {
    dispatch(checkAuthThunk());
  }, [dispatch]);

  // ✅ Force refresh categories on app start
  useEffect(() => {
    if (selectedLocale?.code) {
      dispatch(fetchCategories({ 
        locale: selectedLocale.code, 
        forceRefresh: true  // 🔄 Always fetch fresh data
      }));
    }
  }, [dispatch]); // Only on mount

  return (
    <>
      <LocaleSync />
      <Stack>
        {/* ... */}
      </Stack>
    </>
  );
}
```

**Pros:**
- Always fresh data
- Backend changes show immediately

**Cons:**
- Loading delay on app start
- Uses more bandwidth
- Worse offline experience

---

## Option 3: Hybrid - Check Freshness

Refresh only if data is old (e.g., > 1 hour):

### Update `categorySlice.ts`:

```typescript
interface CategoryState {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    lastFetchedLocale: string | null;
    lastFetchedTime: number | null; // ✅ Add timestamp
}

const initialState: CategoryState = {
    categories: [],
    isLoading: false,
    error: null,
    lastFetchedLocale: null,
    lastFetchedTime: null, // ✅ Add timestamp
};

export const fetchCategories = createAsyncThunk(
    'category/fetchCategories',
    async ({ locale, forceRefresh = false, maxAge = 3600000 }: { 
        locale: string; 
        forceRefresh?: boolean;
        maxAge?: number; // Default: 1 hour
    }, { getState, rejectWithValue }) => {
        try {
            const state = getState() as { category: CategoryState };
            const now = Date.now();
            const age = state.category.lastFetchedTime 
                ? now - state.category.lastFetchedTime 
                : Infinity;
            
            // Skip if cache is fresh and locale matches
            if (!forceRefresh && 
                state.category.lastFetchedLocale === locale && 
                state.category.categories.length > 0 &&
                age < maxAge) {
                console.log('[Category Redux] Using cached categories (age:', Math.round(age/1000), 'seconds)');
                return { categories: state.category.categories, locale };
            }

            console.log('[Category Redux] Fetching fresh categories');
            const categories = await categoriesApi.getCategories();
            return { categories, locale };
        } catch (error: any) {
            console.error('[Category Redux] Error fetching categories:', error);
            return rejectWithValue(error.message || 'Failed to fetch categories');
        }
    }
);

// Update fulfilled case
.addCase(fetchCategories.fulfilled, (state, action) => {
    state.isLoading = false;
    state.categories = action.payload.categories;
    state.lastFetchedLocale = action.payload.locale;
    state.lastFetchedTime = Date.now(); // ✅ Save timestamp
})
```

---

## Option 4: Pull-to-Refresh (Best of Both Worlds)

Add pull-to-refresh to home screen:

### Update `HomeScreen`:

```typescript
import { RefreshControl } from 'react-native';
import { refreshCategories } from '@/store/slices/categorySlice';

const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
    setRefreshing(true);
    if (selectedLocale?.code) {
        await dispatch(refreshCategories(selectedLocale.code));
    }
    setRefreshing(false);
};

return (
    <ScrollView
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        }
    >
        <CategoryList />
        {/* other content */}
    </ScrollView>
);
```

**Pros:**
- Instant load from cache
- User can manually refresh when needed
- Best user experience

---

## My Recommendation

**Use Option 4: Pull-to-Refresh** 🎯

Why?
1. ✅ Instant loading (good UX)
2. ✅ Fresh data when user wants it
3. ✅ Minimal bandwidth usage
4. ✅ Standard mobile pattern
5. ✅ User controls when to refresh

This is what most successful mobile apps do (Instagram, Twitter, etc.).

---

## Quick Implementation (Pull-to-Refresh)

Want me to implement pull-to-refresh for you? Just say "add pull to refresh" and I'll add it to your home screen!

---

**Current Status:** Categories cache on reload ✅  
**Recommended Next Step:** Add pull-to-refresh for manual updates  
**Alternative:** Force refresh on app start (if you need always-fresh data)

