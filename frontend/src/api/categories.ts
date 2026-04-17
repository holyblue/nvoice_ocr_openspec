import client from './client'
import type { Category, CategoryImportResult } from '../types'

export const importCategories = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return client.post<CategoryImportResult>('/categories/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data)
}

export const listCategories = () =>
  client.get<Category[]>('/categories/').then((r) => r.data)

export const getCategory = (id: number) =>
  client.get<Category>(`/categories/${id}`).then((r) => r.data)

export const deleteCategory = (id: number) =>
  client.delete(`/categories/${id}`)
