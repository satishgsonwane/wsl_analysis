"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Camera } from "lucide-react"
import ButtonGrid from "./button-grid"

interface AnalysisPanelProps {
  onCaptureFrame: (camera: string, event: string, framing: string) => void
  capturedFrame: string | null
  onClearFrame: () => void
  onDownloadFrame: () => void
}

export default function AnalysisPanel({
  onCaptureFrame,
  capturedFrame,
  onClearFrame,
  onDownloadFrame,
}: AnalysisPanelProps) {
  // Set default selected values to null (nothing selected)
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [selectedFraming, setSelectedFraming] = useState<string | null>(null)
  const [lastCaptured, setLastCaptured] = useState<{ camera: string; event: string; framing: string } | null>(null)

  // Generate camera buttons
  const cameraButtons = Array.from({ length: 12 }, (_, i) => `Cam ${i + 1}`)

  // Generate event buttons
  const eventButtons = Array.from({ length: 12 }, (_, i) => `Event ${i + 1}`)

  // Generate framing buttons
  const framingButtons = Array.from({ length: 9 }, (_, i) => `Framing ${i + 1}`)

  const handleCaptureClick = () => {
    if (!selectedCamera || !selectedEvent || !selectedFraming) return;
    
    // Save current selections before resetting
    setLastCaptured({
      camera: selectedCamera,
      event: selectedEvent,
      framing: selectedFraming,
    })

    // Call the capture function with current selections
    onCaptureFrame(selectedCamera, selectedEvent, selectedFraming)

    // Reset selections
    setSelectedCamera(null)
    setSelectedEvent(null)
    setSelectedFraming(null)
  }

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Analysis Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ButtonGrid
          title="Camera"
          buttons={cameraButtons}
          columns={4}
          selectedButton={selectedCamera}
          onButtonClick={(camera) => setSelectedCamera(camera)}
        />

        <ButtonGrid
          title="Event"
          buttons={eventButtons}
          columns={4}
          selectedButton={selectedEvent}
          onButtonClick={(event) => setSelectedEvent(event)}
        />

        <ButtonGrid
          title="Framing"
          buttons={framingButtons}
          columns={3}
          selectedButton={selectedFraming}
          onButtonClick={(framing) => setSelectedFraming(framing)}
        />

        <div className="mt-6 p-4 bg-muted rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Selected Options:</h3>
            <Button
              onClick={handleCaptureClick}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              disabled={!selectedCamera || !selectedEvent || !selectedFraming}
            >
              <Camera className="h-4 w-4 mr-1" />
              Capture Frame
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <span className="font-semibold w-24">Camera:</span>
              {selectedCamera ? (
                <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium">{selectedCamera}</span>
              ) : (
                <span className="text-muted-foreground">None selected</span>
              )}
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-24">Event:</span>
              {selectedEvent ? (
                <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium">{selectedEvent}</span>
              ) : (
                <span className="text-muted-foreground">None selected</span>
              )}
            </div>
            <div className="flex items-center">
              <span className="font-semibold w-24">Framing:</span>
              {selectedFraming ? (
                <span className="px-2 py-1 bg-primary/10 rounded text-primary font-medium">{selectedFraming}</span>
              ) : (
                <span className="text-muted-foreground">None selected</span>
              )}
            </div>
          </div>
        </div>

        {capturedFrame && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Captured Frame:</h3>
            {lastCaptured && (
              <div className="text-xs text-muted-foreground mb-2">
                Saved to: {lastCaptured.camera}/{lastCaptured.event}/{lastCaptured.framing}
              </div>
            )}
            <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
              <img
                src={capturedFrame || "/placeholder.svg"}
                alt="Captured frame"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="outline" size="sm" onClick={onClearFrame}>
                Clear
              </Button>
              <Button variant="outline" size="sm" className="ml-2" onClick={onDownloadFrame}>
                Download
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

