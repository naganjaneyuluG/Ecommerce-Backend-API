import { StatusCodes } from 'http-status-codes';
import { AppError } from '@shared/middlewares/error-handler.middleware';
import { generateCleanSlug } from '@shared/utils/slug.util';
import { CategoryRepository } from './category.repository';
import { ICategory } from './category.model';
import { CreateCategoryInput, UpdateCategoryInput } from './category.dto';

interface CategoryTree extends Omit<ICategory, 'parent'> {
  children: CategoryTree[];
}

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  async createCategory(data: CreateCategoryInput): Promise<ICategory> {
    let level = 0;
    if (data.parent) {
      const parentCategory = await this.categoryRepository.findById(data.parent);
      if (!parentCategory) {
        throw new AppError('Parent category not found', StatusCodes.NOT_FOUND);
      }
      level = parentCategory.level + 1;
    }

    const slug = generateCleanSlug(data.name);

    return this.categoryRepository.create({
      name: data.name,
      description: data.description,
      parent: data.parent as unknown as ICategory['parent'],
      slug,
      level,
    });
  }

  async getAllCategories(): Promise<CategoryTree[]> {
    const categories = await this.categoryRepository.findAll();
    return this.buildTree(categories);
  }

  async getCategoryBySlug(slug: string): Promise<ICategory> {
    const category = await this.categoryRepository.findBySlug(slug);
    if (!category) {
      throw new AppError('Category not found', StatusCodes.NOT_FOUND);
    }
    return category;
  }

  async updateCategory(id: string, data: UpdateCategoryInput): Promise<ICategory> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', StatusCodes.NOT_FOUND);
    }

    const updateData: Partial<ICategory> = { ...data } as Partial<ICategory>;
    if (data.name) {
      updateData.slug = generateCleanSlug(data.name);
    }

    if (data.parent !== undefined) {
      if (data.parent) {
        const parentCategory = await this.categoryRepository.findById(data.parent);
        if (!parentCategory) {
          throw new AppError('Parent category not found', StatusCodes.NOT_FOUND);
        }
        if (parentCategory._id?.toString() === id) {
          throw new AppError('Category cannot be its own parent', StatusCodes.BAD_REQUEST);
        }
        updateData.level = parentCategory.level + 1;
      } else {
        updateData.level = 0;
      }
    }

    const updated = await this.categoryRepository.update(id, updateData);
    return updated!;
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Category not found', StatusCodes.NOT_FOUND);
    }

    const hasChildren = await this.categoryRepository.hasChildren(id);
    if (hasChildren) {
      throw new AppError('Cannot delete a category with subcategories', StatusCodes.BAD_REQUEST);
    }

    await this.categoryRepository.delete(id);
  }

  private buildTree(categories: ICategory[]): CategoryTree[] {
    const map = new Map<string, CategoryTree>();
    const roots: CategoryTree[] = [];

    // First pass: create map entries
    for (const cat of categories) {
      const id = (cat._id as string).toString();
      map.set(id, { ...cat.toObject(), children: [] } as unknown as CategoryTree);
    }

    // Second pass: build tree
    for (const cat of categories) {
      const id = (cat._id as string).toString();
      const node = map.get(id)!;
      const parentId = cat.parent?.toString();

      if (parentId && map.has(parentId)) {
        map.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
