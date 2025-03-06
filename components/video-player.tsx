"use client"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Upload, SkipForward, SkipBack } from "lucide-react"

export interface VideoPlayerProps {
  onCaptureFrame: (frameDataUrl: string) => void
}

export default function VideoPlayer({ onCaptureFrame }: VideoPlayerProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener('timeupdate', updateTime)
    return () => {
      video.removeEventListener('timeupdate', updateTime)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoSrc])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSpeedChange = (value: number[]) => {
    const newSpeed = value[0]
    setPlaybackRate(newSpeed)
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed
    }
  }

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw the current frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL and store it
        const frameDataUrl = canvas.toDataURL("image/png")
        onCaptureFrame(frameDataUrl)
      }
    }
  }

  const handleSeekChange = (value: number[]) => {
    setSeeking(true)
    setCurrentTime(value[0])
  }

  const handleSeekCommit = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
    }
    setSeeking(false)
  }

  const seekForward = (seconds: number = 5) => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + seconds, duration)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const seekBackward = (seconds: number = 5) => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - seconds, 0)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full h-full cursor-pointer"
              onEnded={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
              <Upload className="h-10 w-10 mb-2" />
              <span>Click to upload video</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => seekBackward(5)} disabled={!videoSrc}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={togglePlay} disabled={!videoSrc}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={() => seekForward(5)} disabled={!videoSrc}>
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="flex-1 flex items-center space-x-2">
            <span className="text-sm">Speed:</span>
            <Slider
              value={[playbackRate]}
              min={0.25}
              max={2}
              step={0.25}
              onValueChange={handleSpeedChange}
              disabled={!videoSrc}
              className="w-32"
            />
            <span className="text-sm">{playbackRate}x</span>
          </div>

          <label className="cursor-pointer">
            <span className="sr-only">Upload video</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            <Button variant="outline" size="sm" asChild>
              <span>Change Video</span>
            </Button>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm w-12">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              disabled={!videoSrc}
              className="flex-1"
            />
            <span className="text-sm w-12">{formatTime(duration)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

