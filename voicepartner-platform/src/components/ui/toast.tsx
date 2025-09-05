import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  children: React.ReactNode
  className?: string
}

const Toaster = () => {
  return <div id="toast-container" className="fixed top-4 right-4 z-50" />
}

const toast = {
  success: (message: string) => {
    console.log('Success:', message)
  },
  error: (message: string) => {
    console.log('Error:', message)
  },
  info: (message: string) => {
    console.log('Info:', message)
  }
}

export { Toaster, toast }