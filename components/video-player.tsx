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

    const handleTimeUpdate = () => {
      if (!seeking) {
        setCurrentTime(video.currentTime)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handleTimeUpdate)
    video.addEventListener('seeking', handleTimeUpdate)
    video.addEventListener('seeked', handleTimeUpdate)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handleTimeUpdate)
      video.removeEventListener('seeking', handleTimeUpdate)
      video.removeEventListener('seeked', handleTimeUpdate)
    }
  }, [seeking])

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

  // Add a manual time update interval as a fallback
  useEffect(() => {
    if (!videoRef.current || !isPlaying) return
    
    // Create an interval to update the time regularly
    const interval = setInterval(() => {
      if (videoRef.current && !seeking) {
        setCurrentTime(videoRef.current.currentTime)
      }
    }, 250)
    
    return () => clearInterval(interval)
  }, [isPlaying, seeking])

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
    <>
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
              <div className="w-full h-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center mb-4">
                  <Upload className="h-10 w-10 mb-2" />
                  <label className="cursor-pointer text-center">
                    <span>Click to upload local video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {videoSrc && (
            <>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={() => seekBackward(5)}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={togglePlay}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" onClick={() => seekForward(5)}>
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
                    className="flex-1"
                  />
                  <span className="text-sm w-12">{formatTime(duration)}</span>
                </div>
              </div>
            </>
          )}

          {/* Source selection controls */}
          <div className="flex justify-between items-center">
            {videoSrc ? (
              <div className="text-sm">Local video loaded</div>
            ) : (
              <div className="text-sm text-muted-foreground">No video loaded</div>
            )}

            <div className="flex space-x-2">
              {videoSrc && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setVideoSrc(null)
                    setIsPlaying(false)
                    setCurrentTime(0)
                    setDuration(0)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reference Images - Optimized Layout */}
      <Card className="w-full mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Reference Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-medium mb-2">Camera Positions</h3>
              <div className="relative bg-muted rounded-md overflow-hidden flex-grow">
                <img
                  src="/field.png"
                  alt="Camera positions on field"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-medium mb-2">Framing Options</h3>
              <div className="relative bg-muted rounded-md overflow-hidden flex-grow">
                <img
                  src="/framing.jpg"
                  alt="Framing reference options"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

