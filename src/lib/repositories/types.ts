import type {
  User, Category, Ingredient, MealType,
  DietCategoryRule, DietMacroTarget, MealLog, DietConfig,
  CreateUserDto, UpdateUserDto,
  CreateCategoryDto, UpdateCategoryDto,
  CreateIngredientDto, UpdateIngredientDto,
  CreateMealTypeDto, UpdateMealTypeDto,
  SetDietConfigDto,
  CreateMealLogDto,
} from '@/models'

// ─────────────────────────────────────────────────────────────
// Repository interfaces
// ─────────────────────────────────────────────────────────────

export interface UserRepository {
  findAll(): Promise<User[]>
  findById(id: string): Promise<User | null>
  create(data: CreateUserDto): Promise<User>
  update(id: string, data: UpdateUserDto): Promise<User>
  delete(id: string): Promise<void>
}

export interface CategoryRepository {
  findAll(): Promise<Category[]>
  findById(id: string): Promise<Category | null>
  create(data: CreateCategoryDto): Promise<Category>
  update(id: string, data: UpdateCategoryDto): Promise<Category>
  delete(id: string): Promise<void>
}

export interface IngredientRepository {
  findAll(): Promise<Ingredient[]>
  findById(id: string): Promise<Ingredient | null>
  findByCategoryIds(categoryIds: string[]): Promise<Ingredient[]>
  create(data: CreateIngredientDto): Promise<Ingredient>
  update(id: string, data: UpdateIngredientDto): Promise<Ingredient>
  delete(id: string): Promise<void>
}

export interface MealTypeRepository {
  findByUserId(userId: string): Promise<MealType[]>
  findById(id: string): Promise<MealType | null>
  create(data: CreateMealTypeDto): Promise<MealType>
  update(id: string, data: UpdateMealTypeDto): Promise<MealType>
  delete(id: string): Promise<void>
}

export interface DietRepository {
  getConfig(userId: string, mealTypeId: string): Promise<DietConfig>
  setConfig(userId: string, data: SetDietConfigDto): Promise<DietConfig>
  getCategoryRules(userId: string, mealTypeId: string): Promise<DietCategoryRule[]>
  getMacroTarget(userId: string, mealTypeId: string): Promise<DietMacroTarget | null>
}

export interface MealLogRepository {
  findByUserId(userId: string, limit?: number): Promise<MealLog[]>
  findById(id: string): Promise<MealLog | null>
  create(data: CreateMealLogDto): Promise<MealLog>
  delete(id: string): Promise<void>
}

// ─────────────────────────────────────────────────────────────
// Aggregate
// ─────────────────────────────────────────────────────────────

export interface Repositories {
  users: UserRepository
  categories: CategoryRepository
  ingredients: IngredientRepository
  mealTypes: MealTypeRepository
  diet: DietRepository
  mealLogs: MealLogRepository
}
