import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@libs/ui/cn'

/**
 * Colours come from the generated Pi palette (`app/palette.generated.css`) rather than Tailwind's
 * own scale, so a button here is the same green as a button in every other Pi app.
 */
const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-m font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pi-mint-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-pi-mint-500 text-white hover:bg-pi-mint-600',
                outline: 'border border-grey-300 bg-transparent hover:bg-grey-100',
                ghost: 'hover:bg-grey-100',
                link: 'text-pi-mint-700 underline-offset-4 hover:underline'
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded px-3 text-body-s',
                lg: 'h-10 px-6',
                icon: 'size-9'
            }
        },
        defaultVariants: { variant: 'default', size: 'default' }
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /** Render as the child element instead of a `<button>` — for links that look like buttons. */
    asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button'
        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    }
)
Button.displayName = 'Button'

export { buttonVariants }
