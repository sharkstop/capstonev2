
import * as React from "react"
import { format } from "date-fns"
import { Input } from "@/components/ui/input"

interface TimePickerInputProps {
  value?: string | null
  onChange: (time: string) => void
  disabled?: boolean
}

export function TimePickerInput({
  value,
  onChange,
  disabled = false,
}: TimePickerInputProps) {
  const [time, setTime] = React.useState<string>(value || "")
  
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    setTime(newValue)
    onChange(newValue)
  }

  React.useEffect(() => {
    if (value !== undefined && value !== time) {
      setTime(value || "")
    }
  }, [value])

  return (
    <Input
      type="time"
      value={time}
      onChange={handleTimeChange}
      disabled={disabled}
    />
  )
}
