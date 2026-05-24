'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

import { CitySelect } from '@/components/form/city-select';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(phone, name, password, city);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <h1 className="mb-8 text-center text-2xl font-bold">ثبت نام</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}
        <div>
          <label className="mb-1 block text-sm text-gray-700">نام و نام خانوادگی</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">شماره موبایل</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0912xxxxxxx"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-gray-700">رمز عبور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-primary"
            required
            minLength={6}
          />
        </div>
        <CitySelect value={city} onChange={setCity} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? 'در حال ثبت نام...' : 'ثبت نام'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        قبلاً ثبت نام کرده‌اید؟{' '}
        <Link href="/login" className="text-primary hover:underline">
          ورود
        </Link>
      </p>
    </div>
  );
}
