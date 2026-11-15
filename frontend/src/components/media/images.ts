export interface WarehouseImage { id: string; url: string; sortOrder: number }
export interface ImageDraft { key: string; id?: string; file?: File; url: string }

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_IMAGES = 10
export const imageDrafts = (images: WarehouseImage[] = []): ImageDraft[] =>
  images.map(image => ({ key: image.id, id: image.id, url: image.url }))

export function imageFormData(input: object, drafts: ImageDraft[]): FormData {
  const body = new FormData()
  let index = 0
  const images = drafts.map(draft => {
    if (draft.file) { body.append('files', draft.file); return { fileIndex: index++ } }
    return { id: draft.id }
  })
  body.append('data', new Blob([JSON.stringify({ ...input, images })], { type: 'application/json' }))
  return body
}

export function validateImageFiles(files: File[], currentCount: number): string | null {
  if (files.length + currentCount > MAX_IMAGES) return 'Mỗi bộ ảnh có tối đa 10 ảnh.'
  for (const file of files) {
    if (!['image/jpeg', 'image/png'].includes(file.type)) return `${file.name}: chỉ chấp nhận JPEG/PNG.`
    if (!file.size || file.size > MAX_IMAGE_BYTES) return `${file.name}: ảnh phải có nội dung và tối đa 5 MiB.`
  }
  return null
}
