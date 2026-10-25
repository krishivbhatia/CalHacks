import { CATEGORIES, CORE_BAR, WORDS, type Word } from './vocabulary.ts'

export type { Word }

export const wordById = new Map(WORDS.map((w) => [w.id, w]))
// Messages store the label ("my turn"); that is also what Claude receives.
export const wordByLabel = new Map(WORDS.map((w) => [w.label.toLowerCase(), w]))
export const coreBarWords = CORE_BAR.map((id) => wordById.get(id)!)
export const wordsInCategory = (categoryId: string) => WORDS.filter((w) => w.category === categoryId)
export const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]))
