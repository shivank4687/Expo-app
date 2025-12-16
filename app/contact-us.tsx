import { ContactUsScreen } from "@/features/contact-us/screens/contactUsScreen";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";

export default function ContactUs() {
    const { t } = useTranslation();
    return (
        <>
            <Stack.Screen
                options={{
                    title: t('cart.checkout', 'Checkout'),
                    headerBackTitle: t('common.back'),
                }}
            />
            <ContactUsScreen />
        </>
    );
}