import { restApiClient } from '@/services/api/client';

export interface InvitationStats {
    referral_code: string;
    referral_url: string;
    invitations_sent_count: number;
    active_bonuses_count: number;
}

export interface InvitationActivity {
    id: number;
    supplier_id: number;
    type: 'invitation_sent' | 'bonus_applied' | 'referral_joined';
    channel: string | null;
    data: any;
    created_at: string;
    updated_at: string;
}

/**
 * Get invitation stats and link
 */
export const getInvitationStats = async (): Promise<InvitationStats> => {
    const response = await restApiClient.get<{ data: InvitationStats }>(
        '/supplier-app/invitations/stats'
    );
    return response.data;
};

/**
 * Get recent invitation activity
 */
export const getInvitationActivity = async (): Promise<InvitationActivity[]> => {
    const response = await restApiClient.get<{ data: InvitationActivity[] }>(
        '/supplier-app/invitations/activity'
    );
    return response.data;
};

/**
 * Log an invitation action
 */
export const logInvitationAction = async (type: string, channel?: string): Promise<any> => {
    const response = await restApiClient.post(
        '/supplier-app/invitations/log-action',
        { type, channel }
    );
    return response.data;
};
