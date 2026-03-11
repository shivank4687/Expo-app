import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Keyboard,
    Platform,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendRFQQuote, SendQuotePayload } from '../api/rfq.api';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface Props {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    customerId: number;
    quoteId: number;
    productId: number;
}

interface FormState {
    quantity: string;
    price_per_quantity: string;
    shipping_time: string;
    note: string;
    /** '1' | '0' — mirrors the web's select dropdown */
    is_sample: '1' | '0';
    sample_unit: string;
    is_sample_price: '1' | '0';
    sample_price: string;
}

const INITIAL_FORM: FormState = {
    quantity: '',
    price_per_quantity: '',
    shipping_time: '',
    note: '',
    is_sample: '0',
    sample_unit: '',
    is_sample_price: '1',
    sample_price: '',
};

// ─── Reusable components ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
    return <Text style={s.sectionTitle}>{children}</Text>;
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <View style={s.fieldWrapper}>
            <Text style={s.fieldLabel}>
                {label}
                {required && <Text style={s.required}> *</Text>}
            </Text>
            {children}
            {!!error && <Text style={s.errorText}>{error}</Text>}
        </View>
    );
}

function SelectRow({
    label,
    required,
    options,
    value,
    onChange,
    error,
}: {
    label: string;
    required?: boolean;
    options: { label: string; value: '0' | '1' }[];
    value: '0' | '1';
    onChange: (v: '0' | '1') => void;
    error?: string;
}) {
    return (
        <Field label={label} required={required} error={error}>
            <View style={s.segmentRow}>
                {options.map(opt => (
                    <TouchableOpacity
                        key={opt.value}
                        style={[s.segmentBtn, value === opt.value && s.segmentBtnActive]}
                        onPress={() => onChange(opt.value)}
                        activeOpacity={0.8}
                    >
                        <Text style={[s.segmentBtnText, value === opt.value && s.segmentBtnTextActive]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Field>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SendQuoteModal({ visible, onClose, onSuccess, customerId, quoteId, productId }: Props) {
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [submitting, setSubmitting] = useState(false);
    const [kbHeight, setKbHeight] = useState(0);
    const scrollRef = useRef<ScrollView>(null);

    // Track keyboard show/hide and adjust scrollview insets accordingly
    useEffect(() => {
        const onShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            e => setKbHeight(e.endCoordinates.height),
        );
        const onHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => setKbHeight(0),
        );
        return () => { onShow.remove(); onHide.remove(); };
    }, []);

    // Scroll note field fully into view when focused
    const scrollNoteIntoView = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, []);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
        // Clear the error for this field as soon as the user starts editing
        setErrors(prev => {
            if (!prev[key]) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const validate = () => {
        const e: Partial<Record<keyof FormState, string>> = {};

        if (!form.quantity || isNaN(Number(form.quantity)) || Number(form.quantity) < 1)
            e.quantity = 'Enter a valid quantity (min 1)';
        if (!form.price_per_quantity || isNaN(Number(form.price_per_quantity)) || Number(form.price_per_quantity) <= 0)
            e.price_per_quantity = 'Enter a valid price per unit';
        if (!form.note.trim())
            e.note = 'Note is required';
        if (!form.shipping_time || isNaN(Number(form.shipping_time)) || Number(form.shipping_time) < 0)
            e.shipping_time = 'Enter valid shipping days';

        if (form.is_sample === '1') {
            if (!form.sample_unit || isNaN(Number(form.sample_unit)) || Number(form.sample_unit) < 1)
                e.sample_unit = 'Enter valid sample units (min 1)';
            if (form.is_sample_price === '1') {
                if (!form.sample_price || isNaN(Number(form.sample_price)) || Number(form.sample_price) <= 0)
                    e.sample_price = 'Enter a valid charge per unit';
            }
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const noSample = form.is_sample === '0';
            const noSamplePrice = form.is_sample_price === '0';

            const payload: SendQuotePayload = {
                product_id: productId,
                quantity: Number(form.quantity),
                price_per_quantity: Number(form.price_per_quantity),
                shipping_time: Number(form.shipping_time),
                note: form.note.trim(),
                is_sample: noSample ? 0 : 1,
                sample_unit: noSample ? null : Number(form.sample_unit),
                is_sample_price: noSample || noSamplePrice ? 0 : 1,
                sample_price: noSample || noSamplePrice ? null : Number(form.sample_price),
            };

            await sendRFQQuote(customerId, quoteId, payload);
            setForm(INITIAL_FORM);
            setErrors({});
            onSuccess();
        } catch (err: any) {
            const apiMsg = err?.response?.data?.message || err?.response?.data?.errors;
            const display = typeof apiMsg === 'string'
                ? apiMsg
                : 'Failed to send quote. Please try again.';
            setErrors({ note: display });
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setForm(INITIAL_FORM);
        setErrors({});
        onClose();
    };

    const sheetHeight = SCREEN_HEIGHT * 0.88;

    return (
        <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
            <View style={s.overlay}>
                <View style={[s.sheet, { height: sheetHeight }]}>
                    {/* Drag handle */}
                    <View style={s.handle} />

                    {/* Header */}
                    <View style={s.header}>
                        <Text style={s.title}>Send Quote</Text>
                        <TouchableOpacity
                            onPress={handleClose}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="close" size={22} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable body — inset grows with keyboard so Note field is never hidden */}
                    <ScrollView
                        ref={scrollRef}
                        style={s.body}
                        contentContainerStyle={s.bodyContent}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        showsVerticalScrollIndicator={false}
                        contentInset={{ bottom: kbHeight }}
                        scrollIndicatorInsets={{ bottom: kbHeight }}
                        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                    >
                        {/* ── Quote Info ── */}
                        <SectionTitle>Quote Info</SectionTitle>

                        <View style={s.row}>
                            <View style={s.flex1}>
                                <Field label="Quote Quantity" required error={errors.quantity}>
                                    <TextInput
                                        style={[s.input, !!errors.quantity && s.inputError]}
                                        placeholder="e.g. 100"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        value={form.quantity}
                                        onChangeText={v => set('quantity', v)}
                                    />
                                </Field>
                            </View>

                            <View style={s.flex1}>
                                <Field label="Price per Unit" required error={errors.price_per_quantity}>
                                    <TextInput
                                        style={[s.input, !!errors.price_per_quantity && s.inputError]}
                                        placeholder="e.g. 5.00"
                                        placeholderTextColor="#999"
                                        keyboardType="decimal-pad"
                                        value={form.price_per_quantity}
                                        onChangeText={v => set('price_per_quantity', v)}
                                    />
                                </Field>
                            </View>
                        </View>

                        {/* ── Sample Info ── */}
                        <SectionTitle>Sample Info</SectionTitle>

                        <SelectRow
                            label="Provide Samples?"
                            required
                            value={form.is_sample}
                            options={[
                                { label: 'Yes', value: '1' },
                                { label: 'No', value: '0' },
                            ]}
                            onChange={v => {
                                set('is_sample', v);
                                if (v === '0') {
                                    set('sample_unit', '');
                                    set('is_sample_price', '1');
                                    set('sample_price', '');
                                }
                            }}
                            error={errors.is_sample}
                        />

                        {form.is_sample === '1' && (
                            <>
                                <View style={s.row}>
                                    <View style={s.flex1}>
                                        <Field label="Sample Units" required error={errors.sample_unit}>
                                            <TextInput
                                                style={[s.input, !!errors.sample_unit && s.inputError]}
                                                placeholder="e.g. 5"
                                                placeholderTextColor="#999"
                                                keyboardType="numeric"
                                                value={form.sample_unit}
                                                onChangeText={v => set('sample_unit', v)}
                                            />
                                        </Field>
                                    </View>
                                    <View style={s.flex1} />
                                </View>

                                <SelectRow
                                    label="Sample Charge"
                                    required
                                    value={form.is_sample_price}
                                    options={[
                                        { label: 'Applicable', value: '1' },
                                        { label: 'Not Applicable', value: '0' },
                                    ]}
                                    onChange={v => {
                                        set('is_sample_price', v);
                                        if (v === '0') set('sample_price', '');
                                    }}
                                    error={errors.is_sample_price}
                                />

                                {form.is_sample_price === '1' && (
                                    <View style={s.row}>
                                        <View style={s.flex1}>
                                            <Field label="Charge per Unit" required error={errors.sample_price}>
                                                <TextInput
                                                    style={[s.input, !!errors.sample_price && s.inputError]}
                                                    placeholder="e.g. 2.00"
                                                    placeholderTextColor="#999"
                                                    keyboardType="decimal-pad"
                                                    value={form.sample_price}
                                                    onChangeText={v => set('sample_price', v)}
                                                />
                                            </Field>
                                        </View>
                                        <View style={s.flex1} />
                                    </View>
                                )}
                            </>
                        )}

                        {/* ── Shipping Info ── */}
                        <SectionTitle>Shipping Info</SectionTitle>

                        <View style={s.row}>
                            <View style={s.flex1}>
                                <Field label="Shipping Time (days)" required error={errors.shipping_time}>
                                    <TextInput
                                        style={[s.input, !!errors.shipping_time && s.inputError]}
                                        placeholder="e.g. 7"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                        value={form.shipping_time}
                                        onChangeText={v => set('shipping_time', v)}
                                    />
                                </Field>
                            </View>
                            <View style={s.flex1} />
                        </View>

                        <Field label="Note" required error={errors.note}>
                            <TextInput
                                style={[s.input, s.textarea, !!errors.note && s.inputError]}
                                placeholder="Add a note for the buyer…"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={form.note}
                                onChangeText={v => set('note', v)}
                                onFocus={scrollNoteIntoView}
                            />
                        </Field>
                    </ScrollView>

                    {/* Sticky footer */}
                    <View style={s.footer}>
                        <TouchableOpacity
                            style={[s.submitBtn, submitting && s.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            {submitting
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={s.submitText}>Send Quote</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.48)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#DDD',
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
    /* body takes all remaining space and can scroll */
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: 20,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#00615E',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: 16,
        marginBottom: 12,
    },
    fieldWrapper: {
        marginBottom: 14,
    },
    fieldLabel: {
        fontSize: 13,
        color: '#555',
        marginBottom: 6,
        fontWeight: '500',
    },
    required: { color: '#E53935' },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111',
        backgroundColor: '#FAFAFA',
    },
    inputError: { borderColor: '#E53935' },
    textarea: { minHeight: 90 },
    errorText: { fontSize: 11, color: '#E53935', marginTop: 4 },

    row: {
        flexDirection: 'row',
        gap: 12,
    },
    flex1: {
        flex: 1,
    },

    segmentRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        overflow: 'hidden',
    },
    segmentBtn: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
    },
    segmentBtnActive: { backgroundColor: '#00615E' },
    segmentBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },
    segmentBtnTextActive: { color: '#fff' },

    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 28 : 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#fff',
    },
    submitBtn: {
        backgroundColor: '#00615E',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
