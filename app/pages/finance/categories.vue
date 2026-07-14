<template>
  <div class="p-4 md:p-6 max-w-lg mx-auto pb-28 md:pb-6 space-y-5">

    <!-- Back + title -->
    <div class="flex items-center gap-2 -ml-1 pt-1">
      <button
        @click="router.back()"
        class="w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors flex-shrink-0"
        aria-label="Kembali"
      >
        <ArrowLeft class="w-5 h-5" :stroke-width="1.75" />
      </button>
      <h1 class="text-h1 text-foreground">Kelola Kategori</h1>
    </div>

    <!-- Tab switcher -->
    <div class="bg-muted p-1 rounded-xl flex" role="tablist" aria-label="Jenis kategori">
      <button
        role="tab"
        :aria-selected="activeType === 'expense'"
        @click="activeType = 'expense'"
        class="flex-1 h-10 rounded-lg text-body font-semibold transition-all active:scale-[0.97]"
        :class="activeType === 'expense'
          ? 'bg-destructive text-destructive-foreground shadow-elevation-1'
          : 'text-muted-foreground hover:text-foreground'"
      >
        Pengeluaran
      </button>
      <button
        role="tab"
        :aria-selected="activeType === 'income'"
        @click="activeType = 'income'"
        class="flex-1 h-10 rounded-lg text-body font-semibold transition-all active:scale-[0.97]"
        :class="activeType === 'income'
          ? 'bg-success text-success-foreground shadow-elevation-1'
          : 'text-muted-foreground hover:text-foreground'"
      >
        Pemasukan
      </button>
    </div>

    <!-- Add button -->
    <button
      v-if="canManage"
      @click="openCreate"
      class="w-full h-11 rounded-lg border border-dashed border-input text-body font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent transition-colors flex items-center justify-center gap-2"
    >
      <Plus class="w-4 h-4" :stroke-width="1.75" />
      Tambah Kategori {{ activeType === 'expense' ? 'Pengeluaran' : 'Pemasukan' }}
    </button>

    <!-- Empty state -->
    <EmptyState
      v-if="visibleCategories.length === 0"
      :icon="Tag"
      title="Belum Ada Kategori"
      description="Kategori bawaan masih dipakai di form pencatatan. Tambahkan kategori Anda sendiri di sini."
      size="compact"
      class="bg-surface rounded-xl border border-border"
    />

    <!-- Category list -->
    <div
      v-else
      class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
    >
      <div
        v-for="cat in visibleCategories"
        :key="cat.id"
        class="flex items-center justify-between px-4 py-3"
      >
        <p class="text-body text-foreground truncate">{{ cat.name }}</p>
        <div v-if="canManage" class="flex items-center gap-1 flex-shrink-0">
          <button
            @click="openEdit(cat)"
            class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            :aria-label="`Ubah kategori ${cat.name}`"
          >
            <Pencil class="w-4 h-4" :stroke-width="1.75" />
          </button>
          <button
            @click="confirmDelete(cat)"
            class="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            :aria-label="`Hapus kategori ${cat.name}`"
          >
            <Trash2 class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>
      </div>
    </div>

    <!-- Category form sheet -->
    <Transition name="overlay">
      <div v-if="showForm" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px]" @click="closeForm" aria-hidden="true" />
    </Transition>
    <Transition name="sheet">
      <div
        v-if="showForm"
        class="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-[26rem] md:rounded-2xl z-50 bg-surface rounded-t-2xl shadow-elevation-3 flex flex-col"
        role="dialog" aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <h2 class="text-h2 text-foreground">{{ editingId ? 'Ubah Kategori' : 'Kategori Baru' }}</h2>
          <button @click="closeForm" class="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Tutup">
            <X class="w-4 h-4" :stroke-width="1.75" />
          </button>
        </div>

        <div class="p-4 space-y-2">
          <label class="text-small text-muted-foreground">Nama kategori</label>
          <input
            v-model="formName"
            type="text"
            maxlength="100"
            placeholder="mis. Belanja Bahan"
            class="w-full h-11 px-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary"
            @keyup.enter="submit"
          />
          <InlineAlert v-if="formError" variant="destructive">{{ formError }}</InlineAlert>
        </div>

        <div class="p-4 border-t border-border flex-shrink-0">
          <button
            :disabled="saving || !formName.trim()"
            @click="submit"
            class="w-full h-12 rounded-lg font-semibold text-base flex items-center justify-center gap-2"
            :class="saving || !formName.trim() ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'"
          >
            <Loader2 v-if="saving" class="w-4 h-4 animate-spin" :stroke-width="2" />
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
        <div style="height: env(safe-area-inset-bottom, 0px)" />
      </div>
    </Transition>

    <!-- Delete confirm -->
    <Transition name="overlay">
      <div v-if="deleteTarget" class="fixed inset-0 bg-foreground/40 z-40 backdrop-blur-[2px] flex items-center justify-center p-4" @click.self="closeDeleteConfirm">
        <div class="bg-surface rounded-2xl shadow-elevation-3 max-w-sm w-full p-5 space-y-4" role="alertdialog" aria-modal="true">
          <div>
            <p class="text-h3 text-foreground">Hapus kategori?</p>
            <p class="text-body text-muted-foreground mt-1">
              "{{ deleteTarget?.name }}" akan dihapus dan tidak lagi muncul sebagai pilihan kategori.
            </p>
          </div>
          <InlineAlert v-if="deleteError" variant="destructive">{{ deleteError }}</InlineAlert>
          <div class="flex gap-2">
            <button @click="closeDeleteConfirm" class="flex-1 h-11 rounded-lg border border-input text-body font-medium text-foreground hover:bg-muted">
              Batal
            </button>
            <button
              :disabled="deleting"
              @click="performDelete"
              class="flex-1 h-11 rounded-lg bg-destructive text-destructive-foreground text-body font-medium hover:bg-destructive/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Loader2 v-if="deleting" class="w-4 h-4 animate-spin" :stroke-width="2" />
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['finance.view'],
})

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, Pencil, Trash2, X, Loader2, Tag } from '@lucide/vue'
import { useFinanceStore, type FinanceCategory } from '~/stores/finance'
import { useAuthStore } from '~/stores/auth'
import { InlineAlert } from '~/components/ui/inline-alert'
import { EmptyState } from '~/components/ui/empty-state'

const router = useRouter()
const financeStore = useFinanceStore()
const authStore = useAuthStore()
const toast = useToast()

const canManage = computed(() => authStore.hasAnyPermission(['finance.create', 'finance.update', 'finance.delete']))

onMounted(() => {
  financeStore.fetchCategories()
})

const activeType = ref<'expense' | 'income'>('expense')

const visibleCategories = computed(() =>
  financeStore.categories.filter(c => c.type === activeType.value),
)

const showForm = ref(false)
const editingId = ref<string | null>(null)
const formName = ref('')
const formError = ref<string | null>(null)
const saving = ref(false)

const deleteTarget = ref<FinanceCategory | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

function openCreate() {
  editingId.value = null
  formName.value = ''
  formError.value = null
  showForm.value = true
}

function openEdit(cat: FinanceCategory) {
  editingId.value = cat.id
  formName.value = cat.name
  formError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function submit() {
  const name = formName.value.trim()
  if (!name) {
    formError.value = 'Nama wajib diisi.'
    return
  }
  saving.value = true
  formError.value = null
  try {
    if (editingId.value) {
      await financeStore.updateCategory(editingId.value, name)
      showForm.value = false
      toast.success('Kategori diperbarui', `"${name}" sudah tersimpan.`)
    } else {
      await financeStore.createCategory({ name, type: activeType.value })
      showForm.value = false
      toast.success('Kategori ditambahkan', `"${name}" siap dipakai.`)
    }
  } catch (e: any) {
    formError.value = e?.data?.message ?? 'Kategori belum bisa disimpan. Coba lagi sebentar, ya.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(cat: FinanceCategory) {
  deleteTarget.value = cat
  deleteError.value = null
}

function closeDeleteConfirm() {
  deleteTarget.value = null
  deleteError.value = null
}

async function performDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = null
  try {
    const name = deleteTarget.value.name
    await financeStore.deleteCategory(deleteTarget.value.id)
    deleteTarget.value = null
    toast.success('Kategori dihapus', `"${name}" tidak lagi muncul sebagai pilihan.`)
  } catch (e: any) {
    deleteError.value = e?.data?.message ?? 'Kategori belum bisa dihapus. Coba lagi sebentar, ya.'
  } finally {
    deleting.value = false
  }
}
</script>
