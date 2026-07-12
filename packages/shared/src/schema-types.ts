export interface IUser {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
}

export enum ProductType {
  SHOP = 'SHOP',
  CLIENT = 'CLIENT',
}

export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  categoryId: string;
  category?: ICategory;
  userId?: string;
  user?: IUser;
  type: ProductType;
  hasGuarantee: boolean;
  isBoosted: boolean;
  status: ProductStatus;
  city?: string;
  neighborhood?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  group?: 'PART';
  parentId?: string | null;
  sortOrder?: number;
  children?: ICategory[];
}

export interface ICarBrandOption {
  value: string;
  label: string;
}

export interface ICategoriesResponse {
  parts: ICategory[];
  carBrands: ICarBrandOption[];
}
