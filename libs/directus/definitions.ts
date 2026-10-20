/**
 * Directus schema and domain types.
 *
 * Deliberately free of `import 'server-only'` — unlike `client.ts`, which holds the token. A Client
 * Component legitimately needs `ContentNamespace` to render a namespace picker, and importing it
 * from the client module would drag the SDK and the credential into the browser bundle. Same split
 * as `libs/user/definitions.ts`.
 */

/**
 * A row's translations, one per language. The reads in `content.ts` deep-filter this to a single
 * language, so in practice the array holds zero or one entry.
 *
 * `id` has to be here even though no query selects it: the SDK only treats a nested type as a
 * relation — and so only allows `fields: [{ translations: [...] }]` and `deep` — when it can see a
 * primary key. Without it the field is inferred as opaque JSON and the query stops type-checking.
 */
export type WebContentTranslation = {
    id: number
    /**
     * A relation, not a string: the column holds a foreign key into `languages`, whose primary key
     * is the locale code (`th-TH`, `en-US`). Typing it as the related row is what lets a query
     * filter on `languages_code.code`.
     */
    languages_code: DirectusLanguage
    value: string | null
}

export type DirectusLanguage = {
    code: string
    name: string
}

export type WebContent = {
    id: number
    namespace: number
    translations: WebContentTranslation[]
}

/**
 * Namespace ids as stored in the Directus `namespace` collection — the grouping a content row
 * belongs to. Copy in the ones your project uses rather than passing raw numbers around; the full
 * list lives in Directus, not here.
 */
export enum ContentNamespace {
    Common = 1,
    Home = 2
}

/**
 * What `readItems` checks the collection name against, and what it infers the result type from. An
 * empty schema, or one with an index signature, turns the SDK's inference off entirely.
 */
export interface DirectusSchema {
    web_contents: WebContent[]
    // Registered so the SDK can resolve the relations reached from `web_contents`.
    web_contents_translations: WebContentTranslation[]
    languages: DirectusLanguage[]
}

export type Language = 'th' | 'en'

/** One content row with its translation for the requested language (zero or one entry). */
export type ContentRow = {
    id: number
    namespace: number
    translations: { value: string | null }[]
}

/** `degraded` is true when Directus could not be reached and the items are a fallback, not a result. */
export type ContentResult = { items: ContentRow[]; degraded: boolean }
