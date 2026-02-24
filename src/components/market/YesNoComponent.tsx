import type { FC } from "react"

import type { MultiOptionBinaryOption } from "@/features/markets/types"

import { Button } from "../ui/button"

interface YesNoComponentProps {
  option: MultiOptionBinaryOption
}

const YesNoComponent: FC<YesNoComponentProps> = ({ option }) => {
  return (
    <div
      className="
        flex justify-between items-center gap-4 
        w-full h-fit shrink-0 mb-3 p-3 rounded-xl
        transition-colors duration-200
        hover:bg-muted/50
      "
    >
      {/* Date Section */}
      <div
        className="
          flex flex-1 gap-2 items-center min-w-0
          hover:underline
          underline-offset-4
        "
      >
        {option.date}
      </div>

      {/* Buttons Section */}
      <div className="flex justify-end gap-2 items-center">
        <span>{option.yesProbability}%</span>

        <Button
          variant="outline"
          className="flex-1 bg-primary/10 border-primary/20 text-primary font-bold hover:bg-primary hover:text-background transition-all active:scale-95"
        >
          Yes {option.yesProbability}%
        </Button>

        <Button
          variant="outline"
          className="flex-1 bg-secondary/10 border-secondary/20 text-secondary font-bold hover:bg-secondary hover:text-background transition-all active:scale-95"
        >
          No {option.noProbability}%
        </Button>
      </div>
    </div>
  )
}

export default YesNoComponent
