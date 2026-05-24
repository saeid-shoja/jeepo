'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { useCategories } from '@/providers/categories-provider';
import { Shield, TrendingUp } from 'lucide-react';

import { CitySelect } from '@/components/form/city-select';

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { partLeaves: partCategories, carBrands: carBrandOptions } = useCategories();
  const [carBrands, setCarBrands] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [hasGuarantee, setHasGuarantee] = useState(false);
  const [isBoosted, setIsBoosted] = useState(false);
  const [imageLinks, setImageLinks] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const images = imageLinks
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.products.createPublic({
        title,
        description,
        price: Number(price),
        categoryId,
        carBrands: carBrands.length ? carBrands : undefined,
        city: city || undefined,
        phone: phone || undefined,
        hasGuarantee,
        isBoosted,
        images,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="mx-auto max-w-2xl py-8">
      <h1 className="mb-8 text-2xl font-bold">ثبت آگهی جدید</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div>
          <label className="mb-1 block font-medium">عنوان آگهی</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            placeholder="مثلاً: لاستیک ۳۳ اینچ گرندپیت"
            required
          />
        </div>

        <div>
          <label className="mb-1 block font-medium">توضیحات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            placeholder="توضیحات کامل محصول..."
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-medium">قیمت (تومان)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              placeholder="مثلاً: ۵۰۰۰۰۰۰"
              required
            />
          </div>
          <div>
            <label className="mb-1 block font-medium">دسته‌بندی</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              required
            >
              <option value="">انتخاب کنید</option>
              {partCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {carBrandOptions.length > 0 && (
          <div>
            <label className="mb-1 block font-medium">برند خودرو (از لیست انتخاب کنید)</label>
            <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 p-3">
              {carBrandOptions.map((option) => {
                const selected = carBrands.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setCarBrands((prev) =>
                        selected
                          ? prev.filter((v) => v !== option.value)
                          : [...prev, option.value],
                      )
                    }
                    className={`rounded-full px-3 py-1 text-sm transition ${
                      selected
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <CitySelect value={city} onChange={setCity} />
          </div>
          <div>
            <label className="mb-1 block font-medium">شماره تماس</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
              placeholder="0912xxxxxxx"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-medium">لینک تصاویر (هر لینک در یک خط)</label>
          <textarea
            value={imageLinks}
            onChange={(e) => setImageLinks(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-primary"
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
          />
        </div>

        <div className="space-y-3 rounded-xl border bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">ویژگی‌های ویژه</p>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={hasGuarantee}
              onChange={(e) => setHasGuarantee(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-primary"
            />
            <div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Shield className="h-4 w-4 text-green-600" />
                با تضمین فروشگاه
              </div>
              <p className="text-xs text-gray-500">محصول شما با نشان تضمین فروشگاه نمایش داده می‌شود</p>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={isBoosted}
              onChange={(e) => setIsBoosted(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-secondary"
            />
            <div>
              <div className="flex items-center gap-1 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                پله شده
              </div>
              <p className="text-xs text-gray-500">آگهی شما در بالای لیست محصولات نمایش داده می‌شود</p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'در حال ثبت...' : 'ثبت آگهی'}
        </button>
      </form>
    </div>
  );
}
