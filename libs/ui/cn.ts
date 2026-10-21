import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names, with later Tailwind utilities beating earlier ones of the same kind.
 *
 * Plain string concatenation does not do this: `"p-2 p-4"` leaves both in the class list and the
 * winner is whichever CSS rule the stylesheet happens to order last, which is not the one the
 * caller passed.
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
