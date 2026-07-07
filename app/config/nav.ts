import type { Component } from 'vue'
import {
  LayoutDashboard, ShoppingCart, Wallet, Package, Boxes, BarChart2, Settings, Users, ShieldCheck, UserCog
} from '@lucide/vue'

export interface NavItem {
  /** Route path */
  to: string
  /** Lucide Vue icon component */
  icon: Component
  /** Bahasa Indonesia display label */
  label: string
  /**
   * spatie permission names. The nav item is visible if the user holds
   * AT LEAST ONE of these permissions. Empty array = always visible to
   * any authenticated user.
   */
  permissions: string[]
}

/**
 * Static nav registry — permissions drive visibility.
 * When adding a new page, add its entry here — never hardcode nav
 * directly in the layout template.
 *
 * @see §9f of .agents/skills/project/berdikari.md
 */
export const navItems: NavItem[] = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Beranda',
    permissions: [],   // always visible to authenticated users
  },
  {
    to: '/pos',
    icon: ShoppingCart,
    label: 'Kasir',
    permissions: ['pos.view', 'pos.open'],
  },
  {
    to: '/finance',
    icon: Wallet,
    label: 'Keuangan',
    permissions: ['finance.view'],
  },
  {
    to: '/catalog',
    icon: Package,
    label: 'Katalog',
    permissions: ['catalog.view'],
  },
  {
    to: '/inventory',
    icon: Boxes,
    label: 'Stok',
    permissions: ['inventory.view'],
  },
  {
    to: '/reports',
    icon: BarChart2,
    label: 'Laporan',
    permissions: ['report.view'],
  },
  {
    to: '/employees',
    icon: Users,
    label: 'Karyawan',
    permissions: ['employee.view'],
  },
  {
    to: '/settings',
    icon: Settings,
    label: 'Pengaturan',
    permissions: ['business.manage', 'user.manage', 'role.assign'],
  },
  {
    to: '/users',
    icon: UserCog,
    label: 'Pengguna',
    permissions: ['user.manage'],
  },
  {
    to: '/roles',
    icon: ShieldCheck,
    label: 'Peran & Akses',
    permissions: ['role.assign'],
  },
]

/**
 * Mobile bottom nav shows a curated 5-item subset of the full nav.
 * Items that are too infrequent for mobile bottom placement are excluded.
 */
export const mobileNavItems: NavItem[] = navItems.filter(item =>
  ['/', '/pos', '/finance', '/catalog', '/reports'].includes(item.to)
)
