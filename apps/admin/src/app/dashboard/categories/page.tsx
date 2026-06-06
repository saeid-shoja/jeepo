'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  brandCode?: string | null;
  group?: string;
  parentId: string | null;
  libraryId: string | null;
  sortOrder: number;
  isSystem: boolean;
  library?: { id: string; name: string; slug: string } | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number; children: number };
};

type LibraryRow = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  sortOrder?: number;
  isSystem?: boolean;
};

type FormMode = 'part' | 'car-subgroup' | 'car-brand' | 'library';

const emptyPartForm = {
  name: '',
  slug: '',
  libraryId: '',
  parentId: '',
  sortOrder: '0',
};

const emptyCarSubgroupForm = {
  name: '',
  slug: '',
  libraryId: '',
  sortOrder: '0',
};

const emptyCarBrandForm = {
  name: '',
  slug: '',
  brandCode: '',
  libraryId: '',
  parentId: '',
  sortOrder: '0',
};

const emptyLibraryForm = {
  name: '',
  slug: '',
  kind: 'PART_TREE',
  sortOrder: '0',
};

export default function AdminCategoriesPage() {
  const [libraryRecords, setLibraryRecords] = useState<LibraryRow[]>([]);
  const [parts, setParts] = useState<CategoryRow[]>([]);
  const [carBrandCategories, setCarBrandCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>('part');
  const [partForm, setPartForm] = useState(emptyPartForm);
  const [carSubgroupForm, setCarSubgroupForm] = useState(emptyCarSubgroupForm);
  const [carBrandForm, setCarBrandForm] = useState(emptyCarBrandForm);
  const [libraryForm, setLibraryForm] = useState(emptyLibraryForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLibraryId, setEditingLibraryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .categories()
      .then((res) => {
        setLibraryRecords(res.libraryRecords ?? []);
        setParts(res.parts ?? []);
        setCarBrandCategories(res.carBrandCategories ?? []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'خطا در بارگذاری'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const partLibraries = libraryRecords.filter((l) => l.kind === 'PART_TREE');
  const carBrandsLibrary = libraryRecords.find((l) => l.kind === 'CAR_BRANDS');

  const carSubgroups = carBrandCategories.filter((c) => !c.brandCode);
  const carBrands = carBrandCategories.filter((c) => c.brandCode);

  const openCreatePart = (libraryId?: string, parentId?: string) => {
    setFormMode('part');
    setEditingId(null);
    setPartForm({
      ...emptyPartForm,
      libraryId: libraryId ?? partLibraries[0]?.id ?? '',
      parentId: parentId ?? '',
    });
    setShowForm(true);
  };

  const openEditPart = (cat: CategoryRow) => {
    setFormMode('part');
    setEditingId(cat.id);
    setPartForm({
      name: cat.name,
      slug: cat.slug,
      libraryId: cat.libraryId ?? '',
      parentId: cat.parentId ?? '',
      sortOrder: String(cat.sortOrder),
    });
    setShowForm(true);
  };

  const openCreateCarSubgroup = () => {
    setFormMode('car-subgroup');
    setEditingId(null);
    setCarSubgroupForm({
      ...emptyCarSubgroupForm,
      libraryId: carBrandsLibrary?.id ?? '',
    });
    setShowForm(true);
  };

  const openEditCarSubgroup = (cat: CategoryRow) => {
    setFormMode('car-subgroup');
    setEditingId(cat.id);
    setCarSubgroupForm({
      name: cat.name,
      slug: cat.slug,
      libraryId: cat.libraryId ?? '',
      sortOrder: String(cat.sortOrder),
    });
    setShowForm(true);
  };

  const openCreateCarBrand = (parentId?: string) => {
    setFormMode('car-brand');
    setEditingId(null);
    setCarBrandForm({
      ...emptyCarBrandForm,
      libraryId: carBrandsLibrary?.id ?? '',
      parentId: parentId ?? '',
    });
    setShowForm(true);
  };

  const openEditCarBrand = (cat: CategoryRow) => {
    setFormMode('car-brand');
    setEditingId(cat.id);
    setCarBrandForm({
      name: cat.name,
      slug: cat.slug,
      brandCode: cat.brandCode ?? '',
      libraryId: cat.libraryId ?? '',
      parentId: cat.parentId ?? '',
      sortOrder: String(cat.sortOrder),
    });
    setShowForm(true);
  };

  const openCreateLibrary = () => {
    setFormMode('library');
    setEditingLibraryId(null);
    setLibraryForm(emptyLibraryForm);
    setShowForm(true);
  };

  const openEditLibrary = (lib: LibraryRow) => {
    setFormMode('library');
    setEditingLibraryId(lib.id);
    setLibraryForm({
      name: lib.name,
      slug: lib.slug,
      kind: lib.kind,
      sortOrder: String(lib.sortOrder ?? 0),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formMode === 'part') {
        const payload = {
          name: partForm.name.trim(),
          slug: partForm.slug.trim(),
          sortOrder: Number(partForm.sortOrder) || 0,
          libraryId: partForm.libraryId || undefined,
          parentId: partForm.parentId || undefined,
          group: 'PART',
        };
        if (editingId) {
          await adminApi.updateCategory(editingId, {
            ...payload,
            parentId: partForm.parentId || null,
            libraryId: partForm.libraryId || null,
          });
        } else {
          await adminApi.createCategory(payload);
        }
      } else if (formMode === 'car-subgroup') {
        const payload = {
          name: carSubgroupForm.name.trim(),
          slug: carSubgroupForm.slug.trim(),
          sortOrder: Number(carSubgroupForm.sortOrder) || 0,
          libraryId: carSubgroupForm.libraryId || undefined,
          group: 'CAR_BRAND',
        };
        if (editingId) {
          await adminApi.updateCategory(editingId, payload);
        } else {
          await adminApi.createCategory(payload);
        }
      } else if (formMode === 'car-brand') {
        const payload = {
          name: carBrandForm.name.trim(),
          slug: carBrandForm.slug.trim(),
          brandCode: carBrandForm.brandCode.trim().toUpperCase(),
          sortOrder: Number(carBrandForm.sortOrder) || 0,
          libraryId: carBrandForm.libraryId || undefined,
          parentId: carBrandForm.parentId || undefined,
          group: 'CAR_BRAND',
        };
        if (editingId) {
          await adminApi.updateCategory(editingId, {
            ...payload,
            parentId: carBrandForm.parentId || null,
          });
        } else {
          await adminApi.createCategory(payload);
        }
      } else if (formMode === 'library') {
        const payload = {
          name: libraryForm.name.trim(),
          slug: libraryForm.slug.trim(),
          kind: libraryForm.kind,
          sortOrder: Number(libraryForm.sortOrder) || 0,
        };
        if (editingLibraryId) {
          await adminApi.updateLibrary(editingLibraryId, payload);
        } else {
          await adminApi.createLibrary(payload);
        }
      }
      setShowForm(false);
      setEditingId(null);
      setEditingLibraryId(null);
      toast.success('با موفقیت ذخیره شد');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    }
  };

  const handleDeleteCategory = async (cat: CategoryRow) => {
    if (!confirm(`حذف «${cat.name}»؟`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      toast.success('با موفقیت حذف شد');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف');
    }
  };

  const handleDeleteLibrary = async (lib: LibraryRow) => {
    if (!confirm(`حذف کتابخانه «${lib.name}»؟`)) return;
    try {
      await adminApi.deleteLibrary(lib.id);
      toast.success('کتابخانه حذف شد');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در حذف');
    }
  };

  const grouped = partLibraries.map((lib) => ({
    library: lib,
    categories: parts
      .filter((p) => p.libraryId === lib.id)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa')),
  }));

  const formTitle = () => {
    if (formMode === 'library') return editingLibraryId ? 'ویرایش کتابخانه' : 'کتابخانه جدید';
    if (formMode === 'car-subgroup') return editingId ? 'ویرایش زیرگروه' : 'زیرگروه برند خودرو';
    if (formMode === 'car-brand') return editingId ? 'ویرایش برند' : 'برند خودرو جدید';
    return editingId ? 'ویرایش دسته' : 'دسته جدید';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">مدیریت دسته‌بندی‌ها</h1>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openCreateLibrary}
            className="flex items-center gap-2 rounded-sm border px-4 py-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            کتابخانه جدید
          </button>
          <button
            type="button"
            onClick={() => openCreatePart()}
            className="bg-primary flex items-center gap-2 rounded-sm px-4 py-2 text-sm text-white"
          >
            <Plus className="h-4 w-4" />
            دسته جدید
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600">
        تغییرات شما مستقیماً در پایگاه داده ذخیره می‌شود و پس از ذخیره باقی می‌ماند. فایل پیش‌فرض‌ها فقط
        هنگام راه‌اندازی اول یا افزودن اسلاگ جدید در کد، ردیف‌های گم‌شده را می‌سازد — نام، ترتیب و
        زیردسته‌های ویرایش‌شده در پنل بازنویسی نمی‌شوند.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-4">
          <h2 className="font-semibold">{formTitle()}</h2>

          {formMode === 'part' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">نام</span>
                <input
                  required
                  value={partForm.name}
                  onChange={(e) => setPartForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">اسلاگ (انگلیسی)</span>
                <input
                  required
                  value={partForm.slug}
                  onChange={(e) => setPartForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2 ltr text-left"
                  dir="ltr"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">کتابخانه</span>
                <select
                  value={partForm.libraryId}
                  onChange={(e) => setPartForm((f) => ({ ...f, libraryId: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                >
                  <option value="">—</option>
                  {partLibraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">دسته والد (اختیاری)</span>
                <select
                  value={partForm.parentId}
                  onChange={(e) => setPartForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                >
                  <option value="">بدون والد</option>
                  {parts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">ترتیب</span>
                <input
                  type="number"
                  value={partForm.sortOrder}
                  onChange={(e) => setPartForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
            </div>
          )}

          {formMode === 'car-subgroup' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">نام زیرگروه</span>
                <input
                  required
                  value={carSubgroupForm.name}
                  onChange={(e) => setCarSubgroupForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">اسلاگ (انگلیسی)</span>
                <input
                  required
                  value={carSubgroupForm.slug}
                  onChange={(e) => setCarSubgroupForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2 ltr text-left"
                  dir="ltr"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">ترتیب</span>
                <input
                  type="number"
                  value={carSubgroupForm.sortOrder}
                  onChange={(e) => setCarSubgroupForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
            </div>
          )}

          {formMode === 'car-brand' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">نام برند</span>
                <input
                  required
                  value={carBrandForm.name}
                  onChange={(e) => setCarBrandForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">اسلاگ (انگلیسی)</span>
                <input
                  required
                  value={carBrandForm.slug}
                  onChange={(e) => setCarBrandForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2 ltr text-left"
                  dir="ltr"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">کد برند (فیلتر محصول)</span>
                <input
                  required
                  value={carBrandForm.brandCode}
                  onChange={(e) =>
                    setCarBrandForm((f) => ({ ...f, brandCode: e.target.value.toUpperCase() }))
                  }
                  className="w-full rounded-sm border px-3 py-2 ltr text-left uppercase"
                  dir="ltr"
                  placeholder="TOYOTA"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">زیرگروه (اختیاری)</span>
                <select
                  value={carBrandForm.parentId}
                  onChange={(e) => setCarBrandForm((f) => ({ ...f, parentId: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                >
                  <option value="">بدون زیرگروه</option>
                  {carSubgroups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">ترتیب</span>
                <input
                  type="number"
                  value={carBrandForm.sortOrder}
                  onChange={(e) => setCarBrandForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
            </div>
          )}

          {formMode === 'library' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">نام کتابخانه</span>
                <input
                  required
                  value={libraryForm.name}
                  onChange={(e) => setLibraryForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">اسلاگ (انگلیسی)</span>
                <input
                  required
                  value={libraryForm.slug}
                  onChange={(e) => setLibraryForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2 ltr text-left"
                  dir="ltr"
                  disabled={!!editingLibraryId}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">نوع</span>
                <select
                  value={libraryForm.kind}
                  onChange={(e) => setLibraryForm((f) => ({ ...f, kind: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                  disabled={!!editingLibraryId}
                >
                  <option value="PART_TREE">دسته‌بندی قطعات</option>
                  <option value="CAR_BRANDS">برند خودرو</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-gray-600">ترتیب</span>
                <input
                  type="number"
                  value={libraryForm.sortOrder}
                  onChange={(e) => setLibraryForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-full rounded-sm border px-3 py-2"
                />
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="bg-primary rounded-sm px-4 py-2 text-sm text-white">
              ذخیره
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setEditingLibraryId(null);
              }}
              className="rounded-sm border px-4 py-2 text-sm"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">در حال بارگذاری…</p>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border bg-white">
            <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
              <h2 className="font-semibold">کتابخانه‌ها</h2>
              <button
                type="button"
                onClick={openCreateLibrary}
                className="text-primary text-sm hover:underline"
              >
                + کتابخانه جدید
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="border-b text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-right">نام</th>
                  <th className="px-4 py-2 text-right">slug</th>
                  <th className="px-4 py-2 text-right">نوع</th>
                  <th className="px-4 py-2 text-right">ترتیب</th>
                  <th className="px-4 py-2 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {libraryRecords.map((lib) => (
                  <tr key={lib.id} className="border-t">
                    <td className="px-4 py-2">{lib.name}</td>
                    <td className="px-4 py-2 font-mono text-xs ltr text-left" dir="ltr">
                      {lib.slug}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {lib.kind === 'CAR_BRANDS' ? 'برند خودرو' : 'قطعات'}
                    </td>
                    <td className="px-4 py-2">{lib.sortOrder ?? 0}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEditLibrary(lib)}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                          title="ویرایش"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {!lib.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLibrary(lib)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {grouped.map(({ library, categories }) => (
            <div key={library.id} className="overflow-hidden rounded-lg border bg-white">
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
                <h2 className="font-semibold">{library.name}</h2>
                <button
                  type="button"
                  onClick={() => openCreatePart(library.id)}
                  className="text-primary text-sm hover:underline"
                >
                  + زیردسته در این کتابخانه
                </button>
              </div>
              <table className="w-full text-sm">
                <thead className="border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-right">نام</th>
                    <th className="px-4 py-2 text-right">slug</th>
                    <th className="px-4 py-2 text-right">والد</th>
                    <th className="px-4 py-2 text-right">محصولات</th>
                    <th className="px-4 py-2 text-right">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        دسته‌ای ثبت نشده
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="border-t">
                        <td className="px-4 py-2">
                          {cat.parentId ? '↳ ' : ''}
                          {cat.name}
                        </td>
                        <td className="px-4 py-2 font-mono text-xs ltr text-left" dir="ltr">
                          {cat.slug}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{cat.parent?.name ?? '—'}</td>
                        <td className="px-4 py-2">{cat._count?.products ?? 0}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => openEditPart(cat)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              title="ویرایش"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openCreatePart(cat.libraryId ?? undefined, cat.id)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              title="زیردسته"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}

          {carBrandsLibrary && (
            <div className="overflow-hidden rounded-lg border bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-gray-50 px-4 py-3">
                <h2 className="font-semibold">برند خودرو</h2>
                <div className="flex gap-3 text-sm">
                  <button
                    type="button"
                    onClick={openCreateCarSubgroup}
                    className="text-primary hover:underline"
                  >
                    + زیرگروه
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateCarBrand()}
                    className="text-primary hover:underline"
                  >
                    + برند
                  </button>
                </div>
              </div>

              {carSubgroups.length > 0 && (
                <div className="border-b px-4 py-3">
                  <h3 className="mb-2 text-sm font-medium text-gray-700">زیرگروه‌ها</h3>
                  <table className="w-full text-sm">
                    <thead className="text-gray-600">
                      <tr>
                        <th className="py-1 text-right">نام</th>
                        <th className="py-1 text-right">slug</th>
                        <th className="py-1 text-right">عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {carSubgroups.map((sub) => (
                        <tr key={sub.id} className="border-t">
                          <td className="py-2">{sub.name}</td>
                          <td className="py-2 font-mono text-xs ltr text-left" dir="ltr">
                            {sub.slug}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() => openEditCarSubgroup(sub)}
                                className="rounded p-1 text-gray-600 hover:bg-gray-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openCreateCarBrand(sub.id)}
                                className="rounded p-1 text-gray-600 hover:bg-gray-100"
                                title="افزودن برند به این زیرگروه"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(sub)}
                                className="rounded p-1 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <table className="w-full text-sm">
                <thead className="border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-right">نام</th>
                    <th className="px-4 py-2 text-right">کد</th>
                    <th className="px-4 py-2 text-right">زیرگروه</th>
                    <th className="px-4 py-2 text-right">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {carBrands.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        برندی ثبت نشده
                      </td>
                    </tr>
                  ) : (
                    carBrands.map((brand) => (
                      <tr key={brand.id} className="border-t">
                        <td className="px-4 py-2">{brand.name}</td>
                        <td className="px-4 py-2 font-mono text-xs ltr text-left" dir="ltr">
                          {brand.brandCode}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{brand.parent?.name ?? '—'}</td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCarBrand(brand)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(brand)}
                              className="rounded p-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
