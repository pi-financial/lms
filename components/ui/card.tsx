import * as React from 'react'
import { cn } from '@libs/ui/cn'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('rounded-lg border border-grey-200 bg-white shadow-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
}

/**
 * `children` is required rather than spread in with the rest of the props: a heading element with
 * no content is invisible to a screen reader, and the linter cannot tell that a caller will always
 * pass some when the type allows none.
 */
export function CardTitle({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { children: React.ReactNode }) {
    return (
        <h3 className={cn('text-sub-hm font-semibold', className)} {...props}>
            {children}
        </h3>
    )
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn('text-body-s text-grey-600', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-6 pt-0', className)} {...props} />
}
