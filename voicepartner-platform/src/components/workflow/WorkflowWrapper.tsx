'use client'

import dynamic from 'next/dynamic'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

// Dynamically import WorkflowCanvas to avoid SSR issues
const WorkflowCanvas = dynamic(
  () => import('./WorkflowCanvas').then((mod) => ({ default: mod.WorkflowCanvas })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }
)

interface WorkflowWrapperProps {
  className?: string
}

export const WorkflowWrapper = ({ className }: WorkflowWrapperProps) => {
  return <WorkflowCanvas className={className} />
}