import React from 'react';
import { Stack } from 'expo-router';
import { SearchScreen } from '@/features/search/screens/SearchScreen';

export default function SearchPage() {
    return (
        <>
            <Stack.Screen 
                options={{ 
                    headerShown: false 
                }} 
            />
            <SearchScreen />
        </>
    );
}

