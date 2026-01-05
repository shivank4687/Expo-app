import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';
import { AttachIcon, AiIcon } from '@/assets/icons';

const MATERIAL_TYPES = [
    'Wood', 'The work', 'Cotton', 'Leather', 'Silver', 'Food',
    'Obsidian', 'Amber', 'Clay', 'Ceramic', 'Glass'
];

const CATEGORIES = [
    { label: 'Textiles', value: 'textiles' },
    { label: 'Ceramics', value: 'ceramics' },
    { label: 'Jewelry', value: 'jewelry' },
    { label: 'Home Decor', value: 'home_decor' },
    { label: 'Art', value: 'art' },
    { label: 'Food & Beverages', value: 'food_beverages' },
];

const SUBCATEGORIES = [
    { label: 'Rugs', value: 'rugs' },
    { label: 'Blankets', value: 'blankets' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Accessories', value: 'accessories' },
];

const SUB_SUBCATEGORIES = [
    { label: 'Traditional', value: 'traditional' },
    { label: 'Modern', value: 'modern' },
    { label: 'Handwoven', value: 'handwoven' },
    { label: 'Embroidered', value: 'embroidered' },
];

export default function EssentialCard() {
    const [keywords, setKeywords] = useState('');
    const [imageUrl1, setImageUrl1] = useState('');
    const [imageUrl2, setImageUrl2] = useState('');
    const [length, setLength] = useState('');
    const [width, setWidth] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [subSubcategory, setSubSubcategory] = useState('');

    const toggleMaterial = (material: string) => {
        setSelectedMaterials(prev =>
            prev.includes(material)
                ? prev.filter(m => m !== material)
                : [...prev, material]
        );
    };

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>1) Essential</Text>

            {/* Keywords Section */}
            <View style={styles.section}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter here..."
                    placeholderTextColor="#666666"
                    value={keywords}
                    onChangeText={setKeywords}
                />
                <Text style={styles.tipText}>
                    Tip: Use simple words that the buyer will type (alebrije, black clay, mezcal, obsidian...).
                </Text>
            </View>

            {/* Images / Video Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Images / Video</Text>

                <View style={styles.inputGroup}>
                    <View style={styles.inputWithIcon}>
                        <AttachIcon width={16} height={16} />
                        <TextInput
                            style={styles.inputFlex}
                            placeholder="Enter here..."
                            placeholderTextColor="#666666"
                            value={imageUrl1}
                            onChangeText={setImageUrl1}
                        />
                    </View>

                    <View style={styles.inputWithIcon}>
                        <AttachIcon width={16} height={16} />
                        <TextInput
                            style={styles.inputFlex}
                            placeholder="Enter here..."
                            placeholderTextColor="#666666"
                            value={imageUrl2}
                            onChangeText={setImageUrl2}
                        />
                    </View>
                </View>

                <Text style={styles.tipText}>
                    Max. 5 images. Max. 1 video (20 s). Only 2 images can be retouched (center, size, background, light).
                </Text>

                {/* Upload Buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.buttonText}>Edit (2/2)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.buttonText}>Define Cover</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Size and Weight Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Size and Weight</Text>

                <View style={styles.gridInputs}>
                    <TextInput
                        style={styles.gridInput}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={length}
                        onChangeText={setLength}
                    />
                    <TextInput
                        style={styles.gridInput}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={width}
                        onChangeText={setWidth}
                    />
                    <TextInput
                        style={styles.gridInput}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={height}
                        onChangeText={setHeight}
                    />
                    <TextInput
                        style={styles.gridInput}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={weight}
                        onChangeText={setWeight}
                    />
                </View>

                <Text style={styles.tipText}>
                    This improves the automatic shipping quote
                </Text>
            </View>

            {/* Material Type Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Material Type</Text>
                    <Text style={styles.tipText}>You can select multiple values.</Text>
                </View>

                <View style={styles.materialChips}>
                    {MATERIAL_TYPES.map((material, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.materialChip,
                                selectedMaterials.includes(material) && styles.materialChipActive
                            ]}
                            onPress={() => toggleMaterial(material)}
                        >
                            <Text style={styles.materialChipText}>{material}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.addMaterialButton}>
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* AI Suggestion Button */}
                <TouchableOpacity style={styles.aiButton}>
                    <AiIcon width={16} height={16} color="#000000" />
                    <Text style={styles.buttonText}>Suggest material with AI</Text>
                </TouchableOpacity>

                <Text style={styles.tipText}>
                    Fill in SKU, suggest category, generate a short description, and activate the shipping calculation (preview).
                </Text>
            </View>

            {/* Description Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Description..."
                    placeholderTextColor="#666666"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                />
                <Text style={styles.tipText}>
                    Keep the description brief: technical + origin + use.
                </Text>
            </View>

            {/* Category Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Category</Text>
                <Dropdown
                    placeholder="Select category..."
                    options={CATEGORIES}
                    value={category}
                    onSelect={setCategory}
                />
            </View>

            {/* Subcategory Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Subcategory</Text>
                <Dropdown
                    placeholder="Select subcategory..."
                    options={SUBCATEGORIES}
                    value={subcategory}
                    onSelect={setSubcategory}
                />
            </View>

            {/* Sub-subcategory Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Sub-subcategory</Text>
                <Dropdown
                    placeholder="Select sub-subcategory..."
                    options={SUB_SUBCATEGORIES}
                    value={subSubcategory}
                    onSelect={setSubSubcategory}
                />
            </View>

            {/* Add Custom Category Button */}
            <TouchableOpacity style={styles.aiButton}>
                <Ionicons name="add" size={16} color="#000000" />
                <Text style={styles.buttonText}>Add custom category</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
    },
    cardTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    section: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    sectionHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        width: '100%',
    },
    sectionTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    input: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    inputGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    inputWithIcon: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputFlex: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    tipText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 40,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    gridInputs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    gridInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: '48.5%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    materialChips: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    materialChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    materialChipActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    materialChipText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    addMaterialButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: '100%',
        height: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    textArea: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        paddingVertical: 12,
        paddingHorizontal: 16,
        width: '100%',
        height: 100,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
        textAlignVertical: 'top',
    },
});
