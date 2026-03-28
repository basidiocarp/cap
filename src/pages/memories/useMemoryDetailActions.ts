import { useState } from 'react'

import type { Memory } from '../../lib/api'
import { useDeleteMemory, useInvalidateMemory, useMemory, useUpdateImportance } from '../../lib/queries'
import { codeExplorerHref, memoirsHref, memoriesHref, symbolSearchHref } from '../../lib/routes'
import { getMemoryFollowUpQuery } from './memory-utils'

export function useMemoryDetailActions(memory: Memory, onClose: () => void) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showInvalidateForm, setShowInvalidateForm] = useState(false)
  const [invalidateReason, setInvalidateReason] = useState('')
  const deleteMemory = useDeleteMemory()
  const invalidateMemory = useInvalidateMemory()
  const { data: freshMemory } = useMemory(memory.id)
  const updateImportance = useUpdateImportance()
  const detail = freshMemory ?? memory
  const followUpQuery = getMemoryFollowUpQuery(detail)
  const relatedMemoriesHref = followUpQuery ? memoriesHref({ q: followUpQuery, review: 'all' }) : memoriesHref({ topic: detail.topic })
  const relatedMemoirsHref = followUpQuery ? memoirsHref({ filter: followUpQuery }) : memoirsHref()
  const relatedCodeHref = followUpQuery ? symbolSearchHref(followUpQuery) : codeExplorerHref()

  async function handleDelete() {
    await deleteMemory.mutateAsync(detail.id)
    setShowConfirmDelete(false)
    onClose()
  }

  async function handleImportanceChange(importance: string | null) {
    if (importance) {
      await updateImportance.mutateAsync({ id: detail.id, importance })
    }
  }

  async function handleInvalidate() {
    await invalidateMemory.mutateAsync({
      id: detail.id,
      reason: invalidateReason.trim() || undefined,
    })
    setShowInvalidateForm(false)
    setInvalidateReason('')
  }

  return {
    deleteMemory,
    detail,
    handleDelete,
    handleImportanceChange,
    handleInvalidate,
    invalidateMemory,
    invalidateReason,
    relatedCodeHref,
    relatedMemoirsHref,
    relatedMemoriesHref,
    setInvalidateReason,
    setShowConfirmDelete,
    setShowInvalidateForm,
    showConfirmDelete,
    showInvalidateForm,
    updateImportance,
  }
}
