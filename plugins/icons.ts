import {
  ArrowLeft,
  ArrowRight,
  Box,
  Braces,
  Brackets,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleUser,
  Copy,
  Eye,
  EyeOff,
  FilePenLine,
  Grip,
  Group,
  Info,
  List,
  ListPlus,
  Loader2,
  LogOut, MoreHorizontal,
  Package,
  Pencil,
  PlusIcon,
  Settings,
  Settings2,
  Trash,
  TrashIcon,
  User,
  Users,
} from 'lucide-vue-next'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Package', Package)
  nuxtApp.vueApp.component('Braces', Braces)
  nuxtApp.vueApp.component('Brackets', Brackets)
  nuxtApp.vueApp.component('Grip', Grip)
  nuxtApp.vueApp.component('ListPlus', ListPlus)
  nuxtApp.vueApp.component('Pencil', Pencil)
  nuxtApp.vueApp.component('Trash', Trash)
  nuxtApp.vueApp.component('Check', Check)
  nuxtApp.vueApp.component('Loader2', Loader2)
  nuxtApp.vueApp.component('User', User)
  nuxtApp.vueApp.component('ChevronsUpDown', ChevronsUpDown)
  nuxtApp.vueApp.component('Eye', Eye)
  nuxtApp.vueApp.component('EyeOff', EyeOff)
  nuxtApp.vueApp.component('CircleUser', CircleUser)
  nuxtApp.vueApp.component('Group', Group)
  nuxtApp.vueApp.component('Settings', Settings)
  nuxtApp.vueApp.component('Users', Users)
  nuxtApp.vueApp.component('Settings2', Settings2)
  nuxtApp.vueApp.component('ChevronDown', ChevronDown)
  nuxtApp.vueApp.component('PlusIcon', PlusIcon)
  nuxtApp.vueApp.component('TrashIcon', TrashIcon)
  nuxtApp.vueApp.component('CalendarIcon', CalendarIcon)
  nuxtApp.vueApp.component('MoreHorizontal', MoreHorizontal)
  nuxtApp.vueApp.component('ChevronRight', ChevronRight)
  nuxtApp.vueApp.component('ChevronLeft', ChevronLeft)
  nuxtApp.vueApp.component('ArrowRight', ArrowRight)
  nuxtApp.vueApp.component('ArrowLeft', ArrowLeft)
  nuxtApp.vueApp.component('Box', Box)
  nuxtApp.vueApp.component('LogOut', LogOut)
  nuxtApp.vueApp.component('Info', Info)
  nuxtApp.vueApp.component('FilePenLine', FilePenLine)
  nuxtApp.vueApp.component('List', List)
  nuxtApp.vueApp.component('Copy', Copy)
})
