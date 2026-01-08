import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { Ionicons } from '@expo/vector-icons';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    hasError?: boolean;
    minHeight?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Enter text...',
    hasError = false,
    minHeight = 150,
}) => {
    const richText = useRef<RichEditor>(null);
    const [internalValue, setInternalValue] = useState(value);
    const isUserTyping = useRef(false);

    // Update editor content only when value changes externally (not from user input)
    useEffect(() => {
        // Only update if the value changed externally (e.g., from AI generation)
        // and not from user typing
        if (!isUserTyping.current && value !== internalValue && richText.current) {
            richText.current.setContentHTML(value);
            setInternalValue(value);
        }
    }, [value]);

    const handleChange = (html: string) => {
        isUserTyping.current = true;
        setInternalValue(html);
        onChange(html);
        // Reset the flag after a short delay
        setTimeout(() => {
            isUserTyping.current = false;
        }, 100);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.editorContainer, hasError && styles.editorContainerError]}>
                {/* Toolbar */}
                <RichToolbar
                    editor={richText}
                    actions={[
                        actions.setBold,
                        actions.setItalic,
                        actions.setUnderline,
                        actions.insertBulletsList,
                        actions.insertOrderedList,
                        actions.undo,
                        actions.redo,
                    ]}
                    iconMap={{
                        [actions.setBold]: ({ tintColor }: { tintColor: string }) => (
                            <Text style={[styles.toolbarIcon, { color: tintColor }]}>B</Text>
                        ),
                        [actions.setItalic]: ({ tintColor }: { tintColor: string }) => (
                            <Text style={[styles.toolbarIcon, styles.italic, { color: tintColor }]}>I</Text>
                        ),
                        [actions.setUnderline]: ({ tintColor }: { tintColor: string }) => (
                            <Text style={[styles.toolbarIcon, styles.underline, { color: tintColor }]}>U</Text>
                        ),
                        [actions.insertBulletsList]: ({ tintColor }: { tintColor: string }) => (
                            <Ionicons name="list" size={20} color={tintColor} />
                        ),
                        [actions.insertOrderedList]: ({ tintColor }: { tintColor: string }) => (
                            <Ionicons name="list-outline" size={20} color={tintColor} />
                        ),
                        [actions.undo]: ({ tintColor }: { tintColor: string }) => (
                            <Ionicons name="arrow-undo" size={20} color={tintColor} />
                        ),
                        [actions.redo]: ({ tintColor }: { tintColor: string }) => (
                            <Ionicons name="arrow-redo" size={20} color={tintColor} />
                        ),
                    }}
                    style={styles.toolbar}
                    selectedIconTint="#FF6B35"
                    disabledIconTint="#CCCCCC"
                    iconTint="#666666"
                />

                {/* Editor */}
                <RichEditor
                    ref={richText}
                    initialContentHTML={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    style={[styles.editor, { minHeight }]}
                    editorStyle={{
                        backgroundColor: '#EEEEEF',
                        color: '#000000',
                        placeholderColor: '#666666',
                        contentCSSText: `
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 16px;
                            line-height: 24px;
                            padding: 12px;
                            color: #000000;
                        `,
                    }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    editorContainer: {
        width: '100%',
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    editorContainerError: {
        borderColor: '#EF4444',
        borderWidth: 1,
    },
    toolbar: {
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        minHeight: 50,
    },
    toolbarIcon: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    italic: {
        fontStyle: 'italic',
    },
    underline: {
        textDecorationLine: 'underline',
    },
    editor: {
        backgroundColor: '#EEEEEF',
        padding: 0,
    },
});
