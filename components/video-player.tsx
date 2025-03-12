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
  const [notes, setNotes] = useState<string[]>([""])
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0)

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
        
        // Save notes if there are any
        if (notes.some(note => note.trim() !== "")) {
          saveNotes();
        }
        
        // Pass the frame data to the parent component
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

  const handleNotesChange = (value: string, index: number) => {
    const updatedNotes = [...notes];
    updatedNotes[index] = value;
    setNotes(updatedNotes);
  }
  
  const addNewNote = async () => {
    // Get the current note (should be the last one in the array)
    const currentNote = notes[notes.length - 1].trim();
    
    // Only proceed if there's content to save
    if (currentNote) {
      try {
        // Get current video time
        const currentVideoTime = videoRef.current ? videoRef.current.currentTime : 0;
        
        // Save the current note immediately with video time
        const response = await fetch('/api/save-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            notes: currentNote,
            videoTime: currentVideoTime 
          }),
        });
        
        if (response.ok) {
          console.log("Note saved successfully");
          
          // Keep only the last 2 notes and add a new blank one
          // This ensures we show at most 3 notes (2 previous + 1 blank)
          const recentNotes = notes.slice(-2);
          setNotes([...recentNotes, ""]);
          setCurrentNoteIndex(recentNotes.length);
        } else {
          console.error("Failed to save note");
        }
      } catch (error) {
        console.error("Error saving note:", error);
      }
    } else {
      // If the current note is empty, just add another blank note
      // But limit to showing only 3 notes total
      const notesToKeep = notes.slice(-2);
      setNotes([...notesToKeep, ""]);
      setCurrentNoteIndex(notesToKeep.length);
    }
  }
  
  const removeNote = (index: number) => {
    if (notes.length <= 1) return; // Always keep at least one note
    
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    
    // Adjust current note index if needed
    if (currentNoteIndex >= updatedNotes.length) {
      setCurrentNoteIndex(updatedNotes.length - 1);
    } else if (currentNoteIndex > index) {
      setCurrentNoteIndex(currentNoteIndex - 1);
    }
  }
  
  const saveNotes = async () => {
    // Filter out empty notes
    const notesToSave = notes.filter(note => note.trim() !== "");
    
    if (notesToSave.length === 0) return;
    
    try {
      const response = await fetch('/api/save-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: notesToSave.join('\n') }),
      });
      
      if (response.ok) {
        // Keep only the last 2 notes and add a blank one
        const recentNotes = notes.slice(-2);
        setNotes([...recentNotes, ""]);
        setCurrentNoteIndex(recentNotes.length);
        console.log("Notes saved successfully");
      } else {
        console.error("Failed to save notes");
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  }

  // Add this effect to listen for the clearNotes event
  useEffect(() => {
    const handleClearNotes = () => {
      setNotes([""]);
      setCurrentNoteIndex(0);
      console.log("Notes cleared from event");
    };
    
    document.addEventListener('clearNotes', handleClearNotes);
    
    return () => {
      document.removeEventListener('clearNotes', handleClearNotes);
    };
  }, []);

  // Add a new useEffect to limit notes on component mount
  useEffect(() => {
    // On component mount, ensure we only show up to 3 notes
    if (notes.length > 3) {
      const limitedNotes = notes.slice(-3);
      setNotes(limitedNotes);
      setCurrentNoteIndex(Math.min(currentNoteIndex, limitedNotes.length - 1));
    }
  }, []);

  // Add this function to download the SRT file
  const downloadSrtFile = () => {
    // Create a link element
    const link = document.createElement('a');
    link.href = '/captures/notes.srt';
    link.download = 'notes.srt';
    
    // Append to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <h3 className="text-sm font-medium mb-2">Framing Options</h3>
              <div className="relative bg-muted rounded-md overflow-hidden flex-grow">
                <img
                  src="/framing.jpg"
                  alt="Framing reference options"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="flex flex-col h-full">
              <h3 className="text-sm font-medium mb-2">Notes Checklist</h3>
              <div className="relative bg-muted rounded-md overflow-hidden flex-grow p-2 notes-checklist">
                <div className="space-y-2 max-h-[250px] overflow-y-auto p-2">
                  {notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2 bg-background p-2 rounded-md border">
                      <div className="flex-grow">
                        <textarea
                          className="w-full min-h-[60px] p-2 bg-background border-0 focus:ring-0 resize-none"
                          placeholder={index === notes.length - 1 ? "Add a new note..." : "Previous note"}
                          value={note}
                          onChange={(e) => handleNotesChange(e.target.value, index)}
                          readOnly={index !== notes.length - 1} // Only the last note is editable
                        />
                      </div>
                      {index === notes.length - 1 ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            // Clear the current note without saving if it's empty
                            if (!notes[index].trim()) {
                              const updatedNotes = [...notes];
                              updatedNotes[index] = "";
                              setNotes(updatedNotes);
                            }
                          }}
                        >
                          ×
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={downloadSrtFile}
                    className="text-xs"
                  >
                    Download SRT
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addNewNote}
                    className="text-xs"
                  >
                    Save & Add Note
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

