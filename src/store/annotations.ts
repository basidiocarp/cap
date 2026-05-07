import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface ReviewAnnotation {
  id: string
  taskId: string
  filePath: string
  startLine: number
  endLine: number
  comment: string
  action: 'approve' | 'reject' | 'revise'
  anchorHash: string
  createdAt: string
}

interface AnnotationStore {
  annotations: ReviewAnnotation[]
  addAnnotation: (annotation: ReviewAnnotation) => void
  removeAnnotation: (id: string) => void
  getTaskAnnotations: (taskId: string) => ReviewAnnotation[]
}

export const useAnnotationStore = create<AnnotationStore>()(
  persist(
    (set, get) => ({
      addAnnotation: (annotation) =>
        set((state) => ({
          annotations: [...state.annotations, annotation],
        })),
      annotations: [],
      getTaskAnnotations: (taskId) => get().annotations.filter((a) => a.taskId === taskId),
      removeAnnotation: (id) =>
        set((state) => ({
          annotations: state.annotations.filter((a) => a.id !== id),
        })),
    }),
    {
      name: 'review-annotations',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
