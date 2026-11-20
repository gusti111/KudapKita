export type ProductAvailability = 'AVAILABLE' | 'SOLD_OUT' | 'PRE_ORDER';
export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  price: number | null;
  imagePath?: string;
  imageGallery?: string[];
  availability: ProductAvailability;
  isPublished: boolean;
  sortOrder: number;
};
