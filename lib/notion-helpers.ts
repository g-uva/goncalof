import { type Block, type ExtendedRecordMap, type User } from 'notion-types'

type NestedNotionValue<T> =
  | T
  | {
      role: string
      value: T
    }

type BlockMapValue = ExtendedRecordMap['block'][string]['value']
type UserMapValue = ExtendedRecordMap['notion_user'][string]['value']

export function unwrapNotionValue<T>(
  value: NestedNotionValue<T> | undefined
): T | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === 'object' && 'value' in value) {
    return value.value
  }

  return value
}

export function unwrapNotionBlock(
  block: BlockMapValue | undefined
): Block | undefined {
  return unwrapNotionValue(block)
}

export function getRecordMapBlock(
  recordMap: ExtendedRecordMap | undefined,
  blockId: string | undefined
): Block | undefined {
  if (!recordMap || !blockId) {
    return undefined
  }

  return unwrapNotionBlock(recordMap.block[blockId]?.value)
}

export function getRecordMapUser(
  recordMap: ExtendedRecordMap | undefined,
  userId: string | undefined
): User | undefined {
  if (!recordMap || !userId) {
    return undefined
  }

  return unwrapNotionValue<User>(
    recordMap.notion_user[userId]?.value as UserMapValue | undefined
  )
}
