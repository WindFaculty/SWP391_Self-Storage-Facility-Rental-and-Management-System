import { useState } from 'react'
import { ImagePicker } from '../../../components/media/ImagePicker'
import { imageDrafts, type ImageDraft } from '../../../components/media/images'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { updateFacilityImages } from '../api/facilityUnitsApi'
import type { Facility } from '../types'

export function FacilityImagesModal({ facility, onClose, onSaved }: { facility: Facility; onClose: () => void; onSaved: () => Promise<void> }) {
  const [images, setImages] = useState<ImageDraft[]>(() => imageDrafts(facility.images))
  const [busy, setBusy] = useState(false)
  const [imagesBusy, setImagesBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const save = async () => {
    if (busy || imagesBusy) return
    setBusy(true)
    setError(null)
    try { await updateFacilityImages(facility.id, images); await onSaved(); onClose() }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không lưu được bộ ảnh cơ sở.') }
    finally { setBusy(false) }
  }
  return <Modal title={`Ảnh cơ sở ${facility.name}`} onClose={() => { if (!busy) onClose() }}>
    <ImagePicker value={images} onChange={setImages} disabled={busy} onBusyChange={setImagesBusy} />
    {error && <p role="alert" className="mt-3 text-label-help text-danger">{error}</p>}
    <div className="mt-space-lg flex justify-end gap-3">
      <Button variant="outline" onClick={onClose} disabled={busy}>Hủy</Button>
      <Button onClick={() => void save()} disabled={busy || imagesBusy}>{busy ? 'Đang lưu…' : 'Lưu bộ ảnh'}</Button>
    </div>
  </Modal>
}
