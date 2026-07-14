<template>
  <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-5">
    <!-- Page Header -->
    <div class="flex items-start justify-between">
      <div>
        <p class="text-small text-muted-foreground">{{ today }}</p>
        <h1 class="text-h1 text-foreground mt-0.5">Karyawan</h1>
      </div>
      <button
        v-if="auth.hasPermission('employee.create')"
        @click="openCreate"
        class="bg-primary text-primary-foreground px-4 py-2 rounded-lg min-h-[44px] font-semibold text-sm hover:bg-primary/90 active:bg-primary/80 transition-colors flex items-center gap-2"
      >
        <Plus class="w-4 h-4" :stroke-width="2" />
        Tambah
      </button>
    </div>

    <!-- Section tabs -->
    <EmployeeSectionTabs current="employees" />

    <!-- Filters -->
    <div class="flex items-center gap-2">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" :stroke-width="1.75" />
        <input
          v-model="search"
          type="search"
          placeholder="Cari nama karyawan..."
          class="w-full h-10 pl-9 pr-4 bg-background border border-input rounded-lg text-body focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
          aria-label="Cari karyawan"
        />
      </div>
      <FilterSheet
        v-model="statusFilter"
        title="Pilih status karyawan"
        trigger-label="Status"
        :options="statusOptions"
        default-value="semua"
      />
    </div>

    <!-- Loading -->
    <div v-if="hr.loading" class="space-y-2">
      <div v-for="i in 4" :key="i" class="skeleton h-[68px] rounded-xl" />
    </div>

    <!-- Empty state -->
    <EmptyState
      v-else-if="filteredEmployees.length === 0"
      :icon="Users"
      size="compact"
      :title="hr.employees.length === 0 ? 'Belum Ada Karyawan' : 'Karyawan Tidak Ditemukan'"
      :description="hr.employees.length === 0 ? 'Tambahkan karyawan pertama untuk mulai mengelola tim Anda.' : 'Coba kata kunci atau filter lain, ya.'"
      class="bg-surface border border-border rounded-xl p-10"
    />

    <!-- Employee list -->
    <div
      v-else
      class="bg-surface rounded-xl border border-border overflow-hidden shadow-elevation-1 divide-y divide-border"
    >
      <button
        v-for="employee in filteredEmployees"
        :key="employee.id"
        type="button"
        class="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors text-left min-h-[44px]"
        :aria-label="`Detail ${employee.name}`"
        @click="openEdit(employee)"
      >
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
            {{ employee.name.slice(0, 1).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-body text-foreground font-medium truncate">{{ employee.name }}</p>
            <p class="text-small text-muted-foreground truncate">
              {{ employee.position ?? 'Belum ada jabatan' }}{{ employee.phone ? ` · ${employee.phone}` : '' }}
            </p>
          </div>
        </div>
        <span
          class="text-caption px-2 py-1 rounded-full flex-shrink-0 ml-3"
          :class="employee.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'"
        >
          {{ employee.status === 'active' ? 'Aktif' : 'Nonaktif' }}
        </span>
      </button>
    </div>

    <!-- Create / edit drawer -->
    <DrawerRoot v-model:open="showForm">
      <DrawerContent :aria-label="editing ? 'Ubah karyawan' : 'Tambah karyawan'">
        <DrawerHeader>
          <DrawerTitle>{{ editing ? 'Ubah Karyawan' : 'Tambah Karyawan' }}</DrawerTitle>
        </DrawerHeader>
        <form class="flex-1 overflow-y-auto px-5 pb-4 space-y-4" @submit.prevent="save">
          <div>
            <label for="emp-name" class="text-small text-muted-foreground">Nama <span class="text-destructive">*</span></label>
            <Input id="emp-name" v-model="form.name" class="mt-1 h-11" placeholder="Nama lengkap" required />
          </div>
          <div>
            <label for="emp-position" class="text-small text-muted-foreground">Jabatan</label>
            <Input id="emp-position" v-model="form.position" class="mt-1 h-11" placeholder="mis. Kasir, Staf Dapur" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="emp-phone" class="text-small text-muted-foreground">No. HP</label>
              <Input id="emp-phone" v-model="form.phone" class="mt-1 h-11" placeholder="08..." />
            </div>
            <div>
              <label for="emp-hired" class="text-small text-muted-foreground">Mulai bekerja</label>
              <Input id="emp-hired" v-model="form.hired_at" type="date" class="mt-1 h-11" />
            </div>
          </div>
          <div>
            <label for="emp-email" class="text-small text-muted-foreground">Email</label>
            <Input id="emp-email" v-model="form.email" type="email" class="mt-1 h-11" placeholder="opsional" />
          </div>
          <div v-if="editing && auth.hasPermission('employee.update')">
            <label class="text-small text-muted-foreground">Status</label>
            <div class="flex gap-2 mt-1">
              <button
                v-for="option in [{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }]"
                :key="option.value"
                type="button"
                class="flex-1 h-11 rounded-lg text-small font-medium transition-colors border"
                :class="form.status === option.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-foreground border-input hover:bg-muted'"
                @click="form.status = option.value as 'active' | 'inactive'"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <InlineAlert v-if="formError" variant="destructive">{{ formError }}</InlineAlert>
        </form>
        <DrawerFooter>
          <div class="flex w-full gap-2">
            <button type="button" :class="cn(buttonVariants({ variant: 'outline' }), 'flex-1')" @click="showForm = false">
              Batal
            </button>
            <button
              type="button"
              :class="cn(buttonVariants(), 'flex-1')"
              :disabled="saving || !form.name.trim() || (editing !== null && !auth.hasPermission('employee.update'))"
              @click="save"
            >
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" :stroke-width="2" />
              {{ saving ? 'Menyimpan...' : 'Simpan' }}
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>

    <!-- Deactivate confirmation -->
    <ConfirmDialog
      v-model:open="confirmDeactivate"
      title="Nonaktifkan Karyawan Ini?"
      description="Karyawan tidak akan muncul sebagai aktif lagi, tapi Anda tetap bisa mengaktifkannya kembali kapan saja."
      confirm-label="Ya, Nonaktifkan"
      cancel-label="Batal"
      :loading="saving"
      @confirm="doSave"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'permission'],
  permissions: ['employee.view'],
  title: 'Karyawan',
})

import { ref, computed, onMounted } from 'vue'
import { Loader2, Plus, Search, Users } from '@lucide/vue'
import FilterSheet from '~/components/FilterSheet.vue'
import EmployeeSectionTabs from '~/components/EmployeeSectionTabs.vue'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import {
  DrawerContent, DrawerFooter, DrawerHeader, DrawerRoot, DrawerTitle,
} from '@/components/ui/drawer'
import { ConfirmDialog } from '~/components/ui/confirm-dialog'
import { EmptyState } from '~/components/ui/empty-state'
import { InlineAlert } from '~/components/ui/inline-alert'
import { cn } from '@/utils'
import { useAuthStore } from '~/stores/auth'
import { useHrStore, type Employee } from '~/stores/hr'

useHead({ title: 'Karyawan — Berdikari' })

const auth = useAuthStore()
const hr = useHrStore()
const toast = useToast()

const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

const search = ref('')
const statusFilter = ref('semua')
const statusOptions = [
  { value: 'semua', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
]

const filteredEmployees = computed(() => {
  let list = hr.employees
  if (statusFilter.value !== 'semua') list = list.filter(e => e.status === statusFilter.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }
  return list
})

// ── Form drawer ───────────────────────────────────────────────────────────────

const showForm = ref(false)
const editing = ref<Employee | null>(null)
const saving = ref(false)
const formError = ref('')
const confirmDeactivate = ref(false)
const form = ref({
  name: '',
  position: '',
  phone: '',
  email: '',
  hired_at: '',
  status: 'active' as 'active' | 'inactive',
})

function openCreate() {
  editing.value = null
  form.value = { name: '', position: '', phone: '', email: '', hired_at: '', status: 'active' }
  formError.value = ''
  showForm.value = true
}

function openEdit(employee: Employee) {
  editing.value = employee
  form.value = {
    name: employee.name,
    position: employee.position ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    hired_at: employee.hired_at?.slice(0, 10) ?? '',
    status: employee.status,
  }
  formError.value = ''
  showForm.value = true
}

function save() {
  if (!form.value.name.trim() || saving.value) return
  if (editing.value && editing.value.status === 'active' && form.value.status === 'inactive') {
    showForm.value = false
    confirmDeactivate.value = true
    return
  }
  doSave()
}

async function doSave() {
  saving.value = true
  formError.value = ''
  const wasActive = editing.value?.status === 'active'
  const payload = {
    name: form.value.name.trim(),
    position: form.value.position || null,
    phone: form.value.phone || null,
    email: form.value.email || null,
    hired_at: form.value.hired_at || null,
    ...(editing.value ? { status: form.value.status } : {}),
  }
  try {
    if (editing.value) {
      await hr.updateEmployee(editing.value.id, payload as Partial<Employee>)
      if (payload.status === 'inactive') {
        toast.success('Karyawan dinonaktifkan')
      } else if (payload.status === 'active' && !wasActive) {
        toast.success('Karyawan diaktifkan kembali')
      } else {
        toast.success('Data karyawan diperbarui')
      }
    } else {
      await hr.createEmployee(payload as Partial<Employee>)
      toast.success('Karyawan ditambahkan')
    }
    showForm.value = false
  } catch (err: any) {
    const message = err?.data?.message ?? 'Data karyawan belum bisa disimpan. Periksa data dan coba lagi, ya.'
    if (confirmDeactivate.value) {
      toast.error('Karyawan belum bisa dinonaktifkan', message)
    } else {
      formError.value = message
    }
  } finally {
    saving.value = false
    confirmDeactivate.value = false
  }
}

onMounted(() => hr.fetchEmployees())
</script>
