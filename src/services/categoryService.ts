import type { Category } from '@/models'

/**
 * Retorna los IDs de todos los descendientes (hijos, nietos, etc.)
 * de una categoría dada dentro de un array plano de categorías.
 */
export function getDescendantIds(
  categoryId: string,
  allCategories: Category[],
): string[] {
  const result: string[] = []
  const queue: string[] = [categoryId]

  while (queue.length > 0) {
    const current = queue.shift()!
    const children = allCategories.filter(c => c.parentId === current)
    for (const child of children) {
      result.push(child.id)
      queue.push(child.id)
    }
  }

  return result
}

/**
 * Retorna una categoría y todos sus descendientes (incluyéndola).
 */
export function getCategoryWithDescendants(
  categoryId: string,
  allCategories: Category[],
): Category[] {
  const self = allCategories.find(c => c.id === categoryId)
  if (!self) return []
  const descendantIds = getDescendantIds(categoryId, allCategories)
  return [self, ...allCategories.filter(c => descendantIds.includes(c.id))]
}

/**
 * Construye un árbol de categorías a partir de un array plano.
 * Útil para renderizar la jerarquía en el UI.
 */
export interface CategoryNode extends Category {
  children: CategoryNode[]
  depth: number
}

export function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const nodeMap = new Map<string, CategoryNode>()
  for (const cat of categories) {
    nodeMap.set(cat.id, { ...cat, children: [], depth: 0 })
  }

  const roots: CategoryNode[] = []
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  function setDepth(node: CategoryNode, depth: number) {
    node.depth = depth
    for (const child of node.children) {
      setDepth(child, depth + 1)
    }
  }
  for (const root of roots) setDepth(root, 0)

  return roots
}

/**
 * Aplana el árbol de categorías en orden de profundidad para
 * mostrarlo en selects con indentación.
 */
export function flattenCategoryTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = []
  function traverse(list: CategoryNode[]) {
    for (const node of list) {
      result.push(node)
      traverse(node.children)
    }
  }
  traverse(nodes)
  return result
}
