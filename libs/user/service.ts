import 'server-only'

import { Configuration, UserApi, type DtoUserInfo } from '@pi-financial/user-srv-v2-client-axios'
import { logger } from '@libs/logger'
import type { PiUser, UserFilters } from './definitions'
import { toPiUser } from './mapper'

/**
 * user-srv-v2 access.
 *
 * House rule: backend calls go through a published `@pi-financial/*-client-axios` client-lib, never
 * a hand-rolled fetch against a service host. The generated client is regenerated from the service's
 * own swagger on every merge, so a breaking change shows up as a TypeScript error here rather than
 * as a runtime surprise in production.
 *
 * `import 'server-only'` matters twice over: `USER_V2_HOST` points at an address that only resolves
 * inside the cluster, and `/internal/*` carries no authentication at all — it is reachable purely
 * because the network says so. Nothing about this file may run in a browser.
 */
let api: UserApi | null = null

function getUserApi(): UserApi {
    if (!api) {
        const basePath = process.env.USER_V2_HOST
        if (!basePath) throw new Error('USER_V2_HOST is not set — see .env.example')
        api = new UserApi(new Configuration({ basePath }))
    }
    return api
}

/** `result.ResponseError` — what the service returns on a 4xx. `title` is its error code. */
type ServiceError = { status?: number; title?: string; detail?: string }

/**
 * Recognises an axios rejection without importing axios.
 *
 * `axios` is not a direct dependency here: it arrives through the client-lib, which pins its own
 * copy, and `resolutions` in package.json is what keeps the tree down to one. Importing it directly
 * would mean depending on a package we do not declare — so the shape is checked instead.
 */
function toServiceError(error: unknown): ServiceError | undefined {
    if (typeof error !== 'object' || error === null) return undefined

    const response = (error as { response?: { status?: number; data?: unknown } }).response
    if (!response) return undefined

    const data = response.data
    if (typeof data === 'object' && data !== null) return data as ServiceError

    return { status: response.status }
}

/**
 * `GET /internal/v1/users` — returns everyone matching the filters (an array, even for a lookup by
 * a unique-looking field like accountId).
 *
 * Note the argument list is positional in the generated client, and the order is neither
 * alphabetical nor the order the filters are declared in. Getting it wrong silently searches the
 * wrong column, so the call spells out every slot.
 */
export async function findUsers(filters: UserFilters): Promise<PiUser[]> {
    const client = getUserApi()

    try {
        // internalV1UsersGet(accountId, citizenId, email, firstName, ids, lastName, phoneNumber)
        const response = await client.internalV1UsersGet(
            filters.accountId,
            filters.citizenId,
            filters.email,
            filters.firstName,
            filters.ids,
            filters.lastName,
            filters.phoneNumber
        )

        const users: DtoUserInfo[] = response.data?.data ?? []
        logger.info('user-srv: findUsers', { filters, count: users.length })

        return users.map(toPiUser)
    } catch (error) {
        const serviceError = toServiceError(error)
        if (serviceError) {
            logger.error('user-srv: findUsers failed', {
                filters,
                status: serviceError.status,
                title: serviceError.title,
                detail: serviceError.detail
            })
        } else {
            logger.error('user-srv: findUsers failed', { filters, error })
        }
        throw error
    }
}
