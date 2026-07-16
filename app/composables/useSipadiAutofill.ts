import { ref } from 'vue'
import type { TaxReport } from '@/stores/tax'

/**
 * window.postMessage channel shared with the "Berdikari SIPADI Autofill"
 * browser extension (extensions/sipadi-autofill/). Message shape is mirrored
 * in that extension's content/erp-bridge.js — keep both in sync.
 */
const CHANNEL = 'berdikari-sipadi-autofill'

export interface SipadiAutofillPayload {
  /** Informational only — the extension does not gate filling on this. */
  category: string
  month: number
  year: number
  days: { day: number; amount: number }[]
}

interface ExtensionMessage {
  channel: string
  type: 'PONG' | 'FILL_RESPONSE'
  requestId?: string
  ok?: boolean
  message?: string
  filled?: number
  total?: number
}

function waitForMessage(type: 'PONG' | 'FILL_RESPONSE', requestId: string | undefined, timeoutMs: number): Promise<ExtensionMessage | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', onMessage)
      resolve(null)
    }, timeoutMs)

    function onMessage(event: MessageEvent) {
      if (event.source !== window || event.origin !== window.location.origin) return
      const data = event.data as ExtensionMessage | undefined
      if (!data || data.channel !== CHANNEL || data.type !== type) return
      if (requestId && data.requestId !== requestId) return
      clearTimeout(timer)
      window.removeEventListener('message', onMessage)
      resolve(data)
    }

    window.addEventListener('message', onMessage)
  })
}

export function buildSipadiAutofillPayload(report: TaxReport, categoryLabel: string): SipadiAutofillPayload | null {
  if (!report.entries?.length) return null

  return {
    category: categoryLabel,
    month: report.period_month,
    year: report.period_year,
    days: report.entries.map(e => ({ day: e.day_number, amount: Math.round(Number(e.sales)) })),
  }
}

export function useSipadiAutofill() {
  const autofilling = ref(false)
  const toast = useToast()

  async function fillSipadi(report: TaxReport, categoryLabel: string) {
    const payload = buildSipadiAutofillPayload(report, categoryLabel)
    if (!payload) {
      toast.error('Tidak bisa mengisi otomatis', 'Laporan ini belum punya data harian untuk diisi.')
      return
    }

    autofilling.value = true
    try {
      window.postMessage({ channel: CHANNEL, type: 'PING' }, window.location.origin)
      const pong = await waitForMessage('PONG', undefined, 1200)
      if (!pong) {
        toast.error(
          'Ekstensi tidak terdeteksi',
          'Pasang dan aktifkan ekstensi SIPADI Autofill Berdikari di browser ini, lalu coba lagi.',
        )
        return
      }

      const requestId = crypto.randomUUID()
      window.postMessage({ channel: CHANNEL, type: 'FILL_REQUEST', requestId, payload }, window.location.origin)
      const result = await waitForMessage('FILL_RESPONSE', requestId, 20000)

      if (!result) {
        toast.error('Waktu habis', 'Ekstensi tidak merespons. Pastikan tab SIPADI terbuka pada laporan pajak yang sesuai dan Anda sudah login.')
        return
      }

      if (result.ok) {
        toast.success(
          'Formulir SIPADI terisi',
          `${result.filled ?? 0} dari ${result.total ?? payload.days.length} kolom pendapatan harian terisi otomatis. Periksa kembali sebelum submit.`,
        )
      } else {
        toast.error('Gagal mengisi formulir', result.message ?? 'Terjadi kesalahan saat mengisi formulir SIPADI.')
      }
    } finally {
      autofilling.value = false
    }
  }

  return { autofilling, fillSipadi }
}
