import api from '@/services/api/client';

export const regenerateOxxoVoucher = (orderId: number) =>
    api.post(`/supplier-app/orders/${orderId}/payment/regenerate-voucher`);
