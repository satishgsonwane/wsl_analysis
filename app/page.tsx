"use client"

import { useState, useCallback, useRef } from "react"
import VideoPlayer from "@/components/video-player"
import AnalysisPanel from "@/components/analysis-panel"
import { toast } from "@/components/ui/use-toast"
import { ToastProvider } from "@/components/ui/toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// Add this type declaration at the top of your file
declare global {
  interface Window {
    showDirectoryPicker: (options?: any) => Promise<FileSystemDirectoryHandle>;
  }
}

export default function Home() {
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null)
  const [lastCapturePath, setLastCapturePath] = useState<string | null>(null)
  const directoryHandleRef = useRef<FileSystemDirectoryHandle | null>(null)

  const saveFrameToFileSystem = async (frameDataUrl: string, camera: string, event: string, framing: string) => {
    try {
      // Request permission to access file system if not already granted
      if (!directoryHandleRef.current) {
        try {
          // Request a directory from the user
          directoryHandleRef.current = await window.showDirectoryPicker({
            id: "wsl-frames",
            mode: "readwrite",
            startIn: "documents",
          })
        } catch (err) {
          console.error("User cancelled directory selection or API not supported", err)
          return false
        }
      }

      // Create folder structure
      let cameraDir
      try {
        cameraDir = await directoryHandleRef.current.getDirectoryHandle(camera, { create: true })
      } catch (err) {
        console.error(`Failed to create/access ${camera} directory`, err)
        return false
      }

      let eventDir
      try {
        eventDir = await cameraDir.getDirectoryHandle(event, { create: true })
      } catch (err) {
        console.error(`Failed to create/access ${event} directory`, err)
        return false
      }

      let framingDir
      try {
        framingDir = await eventDir.getDirectoryHandle(framing, { create: true })
      } catch (err) {
        console.error(`Failed to create/access ${framing} directory`, err)
        return false
      }

      // Create a file in the framing directory
      const timestamp = new Date().toISOString().replace(/:/g, "-")
      const fileName = `frame_${timestamp}.png`

      // Convert data URL to Blob
      const response = await fetch(frameDataUrl)
      const blob = await response.blob()

      // Create and write to the file
      const fileHandle = await framingDir.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      // Set the path for display
      const path = `${camera}/${event}/${framing}/${fileName}`
      setLastCapturePath(path)

      return true
    } catch (err) {
      console.error("Error saving file:", err)
      return false
    }
  }

  const triggerCaptureFrame = useCallback(
    async (camera: string, event: string, framing: string) => {
      const videoPlayer = document.querySelector("video")
      if (!videoPlayer) {
        console.error("No video element found")
        return
      }

      const canvas = document.createElement("canvas")
      canvas.width = videoPlayer.videoWidth
      canvas.height = videoPlayer.videoHeight

      const context = canvas.getContext("2d")
      if (!context) {
        console.error("Could not get canvas context")
        return
      }

      context.drawImage(videoPlayer, 0, 0, canvas.width, canvas.height)
      const frameDataUrl = canvas.toDataURL("image/png")
      setCapturedFrame(frameDataUrl)

      // Try to save the file to the server
      try {
        // Convert data URL to Blob
        const response = await fetch(frameDataUrl)
        const blob = await response.blob()
        
        // Create FormData to send to the server
        const formData = new FormData()
        formData.append("image", blob, "capture.png")
        formData.append("camera", camera)
        formData.append("event", event)
        formData.append("framing", framing)
        
        // Send to server API
        const saveResponse = await fetch("/api/save-frame", {
          method: "POST",
          body: formData,
        })
        
        const result = await saveResponse.json()
        
        if (result.success) {
          // Set the path for display
          setLastCapturePath(result.path)
          toast({
            title: "Frame saved",
            description: `Saved to ${result.path}`,
          })
        } else {
          // Fall back to client-side download if server fails
          console.error("Server failed to save image:", result.error)
          const link = document.createElement("a")
          link.href = frameDataUrl
          link.download = `${camera}_${event}_${framing}_${new Date().toISOString()}.png`
          link.click()
          
          toast({
            title: "Server save failed",
            description: "Image downloaded to your device instead.",
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Error in save process:", err)
        // Fallback for browsers without server connection
        const link = document.createElement("a")
        link.href = frameDataUrl
        link.download = `${camera}_${event}_${framing}_${new Date().toISOString()}.png`
        link.click()
        
        toast({
          title: "Error saving to server",
          description: "Image downloaded to your device instead.",
          variant: "destructive",
        })
      }
    },
    []
  )

  const handleClearFrame = useCallback(() => {
    setCapturedFrame(null)
    setLastCapturePath(null)
  }, [])

  const handleDownloadFrame = useCallback(() => {
    if (capturedFrame) {
      const link = document.createElement("a")
      link.href = capturedFrame
      link.download = `captured_frame_${new Date().toISOString()}.png`
      link.click()
    } else {
      toast({
        title: "No frame to download",
        description: "Please capture a frame first.",
      })
    }
  }, [capturedFrame])

  return (
    <ToastProvider>
      <main className="flex min-h-screen flex-col p-4 gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <VideoPlayer onCaptureFrame={(frameDataUrl) => setCapturedFrame(frameDataUrl)} />
          </div>
          
          <div className="md:col-span-1">
            <AnalysisPanel
              onCaptureFrame={triggerCaptureFrame}
              capturedFrame={capturedFrame}
              onClearFrame={handleClearFrame}
              onDownloadFrame={handleDownloadFrame}
            />
          </div>
        </div>
      </main>
    </ToastProvider>
  )
}

