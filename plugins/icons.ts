import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookImage,
  Box,
  Braces,
  Brackets,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronLeftCircle,
  ChevronRight,
  ChevronRightCircle,
  ChevronUp,
  ChevronsUpDown,
  CircleUser,
  Copy,
  Eye,
  EyeOff,
  FilePenLine,
  Fullscreen,
  Grip,
  Group,
  Hourglass,
  Image,
  Info, LayoutDashboard,
  List,
  ListPlus,
  Loader2,
  LogOut,
  MenuSquare,
  MoreHorizontal,
  Newspaper,
  Package,
  PauseCircle,
  Pencil,
  PlusIcon,
  Settings,
  Settings2,
  Trash,
  TrashIcon,
  Upload,
  User,
  Users,
  X,
  ZoomIn,
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
  nuxtApp.vueApp.component('Hourglass', Hourglass)
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
  nuxtApp.vueApp.component('Image', Image)
  nuxtApp.vueApp.component('FilePenLine', FilePenLine)
  nuxtApp.vueApp.component('List', List)
  nuxtApp.vueApp.component('Copy', Copy)
  nuxtApp.vueApp.component('LayoutDashboard', LayoutDashboard)
  nuxtApp.vueApp.component('Upload', Upload)
  nuxtApp.vueApp.component('X', X)
  nuxtApp.vueApp.component('ZoomIn', ZoomIn)
  nuxtApp.vueApp.component('Newspaper', Newspaper)
  nuxtApp.vueApp.component('BookImage', BookImage)
  nuxtApp.vueApp.component('AlertCircle', AlertCircle)
  nuxtApp.vueApp.component('PauseCircle', PauseCircle)
  nuxtApp.vueApp.component('ChevronUp', ChevronUp)
  nuxtApp.vueApp.component('ChevronLeftCircle', ChevronLeftCircle)
  nuxtApp.vueApp.component('ChevronRightCircle', ChevronRightCircle)
  nuxtApp.vueApp.component('Fullscreen', Fullscreen)
  nuxtApp.vueApp.component('MenuSquare', MenuSquare)
})
