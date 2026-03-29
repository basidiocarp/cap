import { IconAlertTriangle, IconBulb, IconCheck, IconRepeat } from '@tabler/icons-react'

export function getCategoryIcon(category: string) {
  switch (category) {
    case 'corrections':
      return <IconRepeat size={18} />
    case 'errors':
      return <IconAlertTriangle size={18} />
    case 'tests':
      return <IconCheck size={18} />
    default:
      return <IconBulb size={18} />
  }
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case 'corrections':
      return 'orange'
    case 'errors':
      return 'red'
    case 'tests':
      return 'mycelium'
    default:
      return 'gray'
  }
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case 'corrections':
      return 'Correction'
    case 'errors':
      return 'Error Resolved'
    case 'tests':
      return 'Test Fixed'
    default:
      return 'Lesson'
  }
}
