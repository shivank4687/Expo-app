import { restApiClient } from './client';

export interface ContactUsPayload {
    name: string;
    email: string;
    contact: string;
    message: string;
}

export const contactApi = {
    /**
     * Send contact us message
     * @param data Contact form data
     */
    async contactUs(data: ContactUsPayload): Promise<any> {
        const response = await restApiClient.post('/customer/contact-us', data);
        return response.data;
    },
};

export default contactApi;
