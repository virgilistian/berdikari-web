export type ToastVariant = 'success' | 'destructive' | 'info'

export interface ToastItem {
  id: number
  variant: ToastVariant
  title: string
  description?: string
  duration: number
}

let counter = 0

/** Shared toast queue rendered by <ToastContainer /> (mounted once in app.vue). */
export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  function dismiss(id: number) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  function push(variant: ToastVariant, title: string, description?: string, duration = 4000) {
    const id = ++counter
    toasts.value.push({ id, variant, title, description, duration })
    if (import.meta.client) {
      setTimeout(() => dismiss(id), duration)
    }
    return id
  }

  return {
    toasts,
    success: (title: string, description?: string) => push('success', title, description),
    error: (title: string, description?: string) => push('destructive', title, description, 5000),
    info: (title: string, description?: string) => push('info', title, description),
    dismiss,
  }
}
