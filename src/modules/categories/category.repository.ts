import Category, { ICategory } from './category.model';

export class CategoryRepository {
  async create(data: Partial<ICategory>): Promise<ICategory> {
    return new Category(data).save();
  }

  async findById(id: string): Promise<ICategory | null> {
    return Category.findById(id).populate('parent', 'name slug').exec();
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return Category.findOne({ slug, isActive: true }).populate('parent', 'name slug').exec();
  }

  async findAll(activeOnly = true): Promise<ICategory[]> {
    const query = activeOnly ? { isActive: true } : {};
    return Category.find(query).populate('parent', 'name slug').sort({ level: 1, name: 1 }).exec();
  }

  async findByParent(parentId: string | null): Promise<ICategory[]> {
    return Category.find({ parent: parentId, isActive: true }).sort({ name: 1 }).exec();
  }

  async update(id: string, data: Partial<ICategory>): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, data, { new: true }).populate('parent', 'name slug').exec();
  }

  async delete(id: string): Promise<ICategory | null> {
    return Category.findByIdAndDelete(id).exec();
  }

  async hasChildren(parentId: string): Promise<boolean> {
    const count = await Category.countDocuments({ parent: parentId });
    return count > 0;
  }
}
