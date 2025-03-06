"use client"

import { useState, useRef, useEffect, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Pause, Upload, SkipForward, SkipBack, Youtube } from "lucide-react"
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube"

export interface VideoPlayerProps {
  onCaptureFrame: (frameDataUrl: string) => void
}

export default function VideoPlayer({ onCaptureFrame }: VideoPlayerProps) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [youtubeId, setYoutubeId] = useState<string | null>(null)
  const [youtubeUrl, setYoutubeUrl] = useState<string>("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const youtubeRef = useRef<YouTubePlayer | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [availableQualities, setAvailableQualities] = useState<string[]>([])
  const [currentQuality, setCurrentQuality] = useState<string>('auto')
  const [qualitiesLoading, setQualitiesLoading] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || youtubeId) return

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
  }, [youtubeId, seeking])

  useEffect(() => {
    const video = videoRef.current
    if (!video || youtubeId) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [videoSrc, youtubeId])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setYoutubeId(null)
      setYoutubeUrl("")
      const url = URL.createObjectURL(file)
      setVideoSrc(url)
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }

  const togglePlay = () => {
    if (youtubeId && youtubeRef.current) {
      if (isPlaying) {
        youtubeRef.current.internalPlayer.pauseVideo()
      } else {
        youtubeRef.current.internalPlayer.playVideo()
      }
      setIsPlaying(!isPlaying)
    } else if (videoRef.current) {
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
    if (youtubeId && youtubeRef.current) {
      youtubeRef.current.internalPlayer.setPlaybackRate(newSpeed)
    } else if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed
    }
  }

  const captureFrame = () => {
    if (youtubeId) {
      // For YouTube videos, we need to capture from the iframe
      // This is more complex due to CORS restrictions
      // We'll use a workaround with html2canvas in a production app
      console.warn("Frame capture from YouTube videos is limited due to CORS restrictions")
      
      // Basic implementation that will capture the visible area
      const canvas = document.createElement('canvas')
      const youtubeElement = document.querySelector('.youtube-container iframe')
      
      if (youtubeElement) {
        const rect = youtubeElement.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
        
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(youtubeElement as HTMLImageElement, 0, 0, rect.width, rect.height)
          const frameDataUrl = canvas.toDataURL('image/png')
          onCaptureFrame(frameDataUrl)
        }
      }
    } else if (videoRef.current && canvasRef.current) {
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
    if (youtubeId && youtubeRef.current) {
      youtubeRef.current.internalPlayer.seekTo(value[0])
    } else if (videoRef.current) {
      videoRef.current.currentTime = value[0]
    }
    setSeeking(false)
  }

  const seekForward = (seconds: number = 5) => {
    if (youtubeId && youtubeRef.current) {
      const newTime = Math.min(currentTime + seconds, duration)
      youtubeRef.current.internalPlayer.seekTo(newTime)
      setCurrentTime(newTime)
    } else if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + seconds, duration)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const seekBackward = (seconds: number = 5) => {
    if (youtubeId && youtubeRef.current) {
      const newTime = Math.max(currentTime - seconds, 0)
      youtubeRef.current.internalPlayer.seekTo(newTime)
      setCurrentTime(newTime)
    } else if (videoRef.current) {
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

  // Extract YouTube ID from URL
  const handleYoutubeUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setYoutubeUrl(e.target.value)
  }

  const loadYoutubeVideo = () => {
    if (!youtubeUrl) return
    
    try {
      // Extract YouTube video ID from various URL formats
      let id = null
      
      // Regular YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
      const regularMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
      if (regularMatch && regularMatch[1]) {
        id = regularMatch[1]
      }
      
      // YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
      const shortsMatch = youtubeUrl.match(/youtube\.com\/shorts\/([^&\s]+)/)
      if (shortsMatch && shortsMatch[1]) {
        id = shortsMatch[1]
      }
      
      // YouTube Embed: https://www.youtube.com/embed/VIDEO_ID
      const embedMatch = youtubeUrl.match(/youtube\.com\/embed\/([^&\s]+)/)
      if (embedMatch && embedMatch[1]) {
        id = embedMatch[1]
      }
      
      if (id) {
        setYoutubeId(id)
        setVideoSrc(null)
        setIsPlaying(false)
        setCurrentTime(0)
      } else {
        console.error("Invalid YouTube URL")
      }
    } catch (error) {
      console.error("Error parsing YouTube URL:", error)
    }
  }

  // YouTube player event handlers
  const onYoutubeReady = (event: YouTubeEvent) => {
    // Store the duration when the player is ready
    setDuration(event.target.getDuration())
    
    // Set loading state
    setQualitiesLoading(true)
    
    // Get available quality levels
    const qualities = event.target.getAvailableQualityLevels()
    setAvailableQualities(qualities)
    
    // Set initial quality to highest available
    if (qualities.length > 0) {
      // YouTube quality levels are ordered from highest to lowest
      const highestQuality = qualities[0]
      event.target.setPlaybackQuality(highestQuality)
      setCurrentQuality(highestQuality)
    }
    
    setQualitiesLoading(false)
    
    // Force high quality if available
    setTimeout(() => {
      if (event.target && event.target.getAvailableQualityLevels().includes('hd1080')) {
        event.target.setPlaybackQuality('hd1080')
        setCurrentQuality('hd1080')
      } else if (event.target && event.target.getAvailableQualityLevels().includes('hd720')) {
        event.target.setPlaybackQuality('hd720')
        setCurrentQuality('hd720')
      }
      
      // Update available qualities again after a delay
      setAvailableQualities(event.target.getAvailableQualityLevels())
    }, 1000)
  }

  const onYoutubeStateChange = (event: any) => {
    // Update playing state based on YouTube player state
    // 1 = playing, 2 = paused, 0 = ended
    setIsPlaying(event.data === 1)
    
    if (event.data === 0) {
      // Video ended
      setIsPlaying(false)
    }
  }

  const onYoutubePlaybackRateChange = (event: any) => {
    setPlaybackRate(event.data)
  }

  const onYoutubeProgress = (event: any) => {
    if (!seeking) {
      setCurrentTime(event.target.getCurrentTime())
    }
  }

  // Modify the YouTube player options to show native controls
  const youtubeOpts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      // Enable native YouTube controls
      controls: 1,
      disablekb: 0,
      enablejsapi: 1,
      iv_load_policy: 3,
      modestbranding: 1,
      rel: 0,
      vq: 'hd1080'
    },
  }

  // Set up interval for tracking YouTube playback position
  useEffect(() => {
    if (!youtubeId || !youtubeRef.current) return
    
    const interval = setInterval(() => {
      if (youtubeRef.current && !seeking) {
        youtubeRef.current.internalPlayer.getCurrentTime().then((time: number) => {
          setCurrentTime(time)
        })
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [youtubeId, seeking])

  const changeQuality = (quality: string) => {
    if (youtubeRef.current) {
      youtubeRef.current.internalPlayer.setPlaybackQuality(quality)
      setCurrentQuality(quality)
    }
  }

  // Add a manual time update interval as a fallback
  useEffect(() => {
    if (youtubeId || !videoRef.current || !isPlaying) return
    
    // Create an interval to update the time regularly
    const interval = setInterval(() => {
      if (videoRef.current && !seeking) {
        setCurrentTime(videoRef.current.currentTime)
      }
    }, 250)
    
    return () => clearInterval(interval)
  }, [youtubeId, isPlaying, seeking])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Video Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video bg-muted rounded-md overflow-hidden flex items-center justify-center">
          {youtubeId ? (
            <div className="w-full h-full youtube-container">
              <YouTube
                videoId={youtubeId}
                opts={youtubeOpts}
                onReady={(e: YouTubeEvent) => {
                  youtubeRef.current = e
                  onYoutubeReady(e)
                }}
                onStateChange={onYoutubeStateChange}
                onPlaybackRateChange={onYoutubePlaybackRateChange}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full h-full"
              />
            </div>
          ) : videoSrc ? (
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
              
              <div className="w-full max-w-md mt-4">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Paste YouTube URL"
                    value={youtubeUrl}
                    onChange={handleYoutubeUrlChange}
                  />
                  <Button onClick={loadYoutubeVideo} type="button" size="sm">
                    Load
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Show custom controls only for local videos */}
        {videoSrc && !youtubeId && (
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

        {/* Always show source selection controls */}
        <div className="flex justify-between items-center">
          {youtubeId ? (
            <div className="flex items-center">
              <span className="text-sm mr-2">YouTube:</span>
              <span className="text-sm font-medium truncate max-w-md">{youtubeUrl}</span>
            </div>
          ) : videoSrc ? (
            <div className="text-sm">Local video loaded</div>
          ) : (
            <div className="text-sm text-muted-foreground">No video loaded</div>
          )}

          <div className="flex space-x-2">
            {!youtubeId && (
              <div className="w-full max-w-xs">
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="Paste YouTube URL"
                    value={youtubeUrl}
                    onChange={handleYoutubeUrlChange}
                    className="text-sm"
                  />
                  <Button onClick={loadYoutubeVideo} type="button" size="sm">
                    Load
                  </Button>
                </div>
              </div>
            )}
            
            {(videoSrc || youtubeId) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setVideoSrc(null)
                  setYoutubeId(null)
                  setYoutubeUrl("")
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
  )
}

