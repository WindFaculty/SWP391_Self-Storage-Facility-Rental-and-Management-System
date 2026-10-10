import { EmptyState } from '../../components/ui/EmptyState'

export function NotBuiltPage({ title }: { title: string }) {
  return (
    <EmptyState
      icon="construction"
      title={title}
      description="Màn hình này thuộc các task FE2 tiếp theo (W4–W7) và chưa được triển khai trong lát cắt hiện tại."
    />
  )
}
