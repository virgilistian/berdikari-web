import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/auth';

export interface CartItem {
    product_id: string;
    name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
}

export interface SaleOrder {
    id: string;
    order_no: string | null;
    status: string;
    payment_status: string;
    total_amount: string;
    paid_amount: string;
    change_amount: string;
    balance_due: number;
    customer_name: string | null;
    items: any[];
    payments: any[];
    created_at: string;
}

export const useCartStore = defineStore('cart', () => {
    const items = ref<any[]>([]);
    const submitting = ref(false);
    const lastOrder = ref<SaleOrder | null>(null);
    const customerName = ref('');

    const addToCart = (product: any) => {
        const existing = items.value.find(item => item.product_id === product.id);
        if (existing) {
            existing.quantity++;
            existing.subtotal = existing.quantity * existing.unit_price;
        } else {
            items.value.push({
                product_id: product.id,
                name: product.name,
                unit_price: product.price,
                quantity: 1,
                subtotal: product.price,
            });
        }
    };

    const removeFromCart = (productId: string) => {
        items.value = items.value.filter(item => item.product_id !== productId);
    };

    const increaseQuantity = (productId: string) => {
        const item = items.value.find(item => item.product_id === productId);
        if (item) {
            item.quantity++;
            item.subtotal = item.quantity * item.unit_price;
        }
    };

    const decreaseQuantity = (productId: string) => {
        const item = items.value.find(item => item.product_id === productId);
        if (item) {
            if (item.quantity > 1) {
                item.quantity--;
                item.subtotal = item.quantity * item.unit_price;
            } else {
                removeFromCart(productId);
            }
        }
    };

    const clearCart = () => {
        items.value = [];
        customerName.value = '';
    };

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => total + item.subtotal, 0);
    });

    const totalItems = computed(() => {
        return items.value.reduce((total, item) => total + item.quantity, 0);
    });

    /**
     * Submit the current cart to the Sales API.
     *
     * @param action    'complete' finalizes the order (goods out), 'hold' saves it.
     * @param payment    Amount tendered. undefined = pay later (no payment).
     * @param method     Payment method (cash | qris | transfer).
     * @param customerName Optional customer label for pay-later / receipts.
     */
    async function submitOrder(opts: {
        action?: 'complete' | 'hold';
        payment?: number;
        method?: string;
        customerName?: string;
    } = {}): Promise<SaleOrder> {
        if (items.value.length === 0) throw new Error('Keranjang kosong');
        const auth = useAuthStore();
        const api = useApi();
        submitting.value = true;
        try {
            const payments = (opts.payment && opts.payment > 0)
                ? [{ amount: opts.payment, method: opts.method ?? 'cash' }]
                : [];

            const res = await api<{ data: SaleOrder }>('/v1/sales/orders', {
                method: 'POST',
                body: {
                    business_id: auth.user?.business_id,
                    action: opts.action ?? 'complete',
                    customer_name: opts.customerName ?? (customerName.value || null),
                    items: items.value.map(i => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                        unit_price: i.unit_price,
                    })),
                    payments,
                },
            });
            lastOrder.value = res.data;
            clearCart();
            return res.data;
        } finally {
            submitting.value = false;
        }
    }

    /** Add a payment against an existing order (partial payment / settle pay-later). */
    async function payOrder(orderId: string, amount: number, method = 'cash'): Promise<SaleOrder> {
        const api = useApi();
        const res = await api<{ data: SaleOrder }>(`/v1/sales/orders/${orderId}/payments`, {
            method: 'POST',
            body: { amount, method },
        });
        return res.data;
    }

    return {
        items,
        submitting,
        lastOrder,
        customerName,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        submitOrder,
        payOrder,
        totalAmount,
        totalItems,
    };
});
