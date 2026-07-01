import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCartStore = defineStore('cart', () => {
    const items = ref<any[]>([]);

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
    };

    const totalAmount = computed(() => {
        return items.value.reduce((total, item) => total + item.subtotal, 0);
    });

    const totalItems = computed(() => {
        return items.value.reduce((total, item) => total + item.quantity, 0);
    });

    return {
        items,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalAmount,
        totalItems,
    };
});
