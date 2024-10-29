import React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cn } from "../../lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleTrigger
    ref={ref}
    className={cn(
      "flex items-center justify-between w-full px-4 py-2 text-sm font-medium transition-all",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleTrigger>
))

CollapsibleTrigger.displayName = CollapsiblePrimitive.CollapsibleTrigger.displayName

const CollapsibleContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.CollapsibleContent
    ref={ref}
    className={cn(
      "overflow-hidden transition-all",
      "data-[state=closed]:animate-collapse data-[state=open]:animate-expand",
      className
    )}
    {...props}
  >
    {children}
  </CollapsiblePrimitive.CollapsibleContent>
))

CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName

export { Collapsible, CollapsibleTrigger, CollapsibleContent }