"use client"

import { Button } from "@/components/ui/button"

interface ButtonGridProps {
  title: string
  buttons: string[]
  columns: number
  selectedButton: string | null
  onButtonClick: (button: string) => void
}

export default function ButtonGrid({ title, buttons, columns, selectedButton, onButtonClick }: ButtonGridProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {buttons.map((button) => (
          <Button
            key={button}
            variant={selectedButton === button ? "default" : "outline"}
            onClick={() => onButtonClick(button)}
            className="h-10"
          >
            {button}
          </Button>
        ))}
      </div>
    </div>
  )
}

