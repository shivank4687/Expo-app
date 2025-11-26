module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './src',
                        '@features': './src/features',
                        '@shared': './src/shared',
                        '@services': './src/services',
                        '@navigation': './src/navigation',
                        '@theme': './src/theme',
                        '@config': './src/config',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
    };
};
