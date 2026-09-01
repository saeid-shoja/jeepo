'use client';

import {
  IRAN_TEN_DIGIT_REGEX,
  normalizeTenDigits,
  USER_ACCOUNT_KIND_LABELS,
  USER_ACCOUNT_KINDS,
  type UserAccountKind,
} from '@offroad/shared';
import { Loader2, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CitySelect } from '@/components/form/city-select';
import { DigitsInput } from '@/components/form/digits-input';
import { ProfileDocImageField } from '@/components/profile/profile-doc-image-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

type ProfileShape = {
  name?: string;
  city?: string | null;
  nationalId?: string | null;
  nationalIdCardImage?: string | null;
  consentSelfieImage?: string | null;
  shopLicenseImage?: string | null;
  address?: string | null;
  postalCode?: string | null;
  accountKind?: UserAccountKind | string | null;
};

type ProfileEditDialogProps = {
  profile: ProfileShape | null;
  onUpdated: (profile: ProfileShape & { name: string }) => void;
};

export function ProfileEditDialog({ profile, onUpdated }: ProfileEditDialogProps) {
  const { patchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [nationalIdCardImage, setNationalIdCardImage] = useState<string | null>(null);
  const [consentSelfieImage, setConsentSelfieImage] = useState<string | null>(null);
  const [shopLicenseImage, setShopLicenseImage] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [accountKind, setAccountKind] = useState<UserAccountKind>('REGULAR');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(profile?.name ?? '');
    setCity(profile?.city ?? '');
    setNationalId(profile?.nationalId ?? '');
    setNationalIdCardImage(profile?.nationalIdCardImage ?? null);
    setConsentSelfieImage(profile?.consentSelfieImage ?? null);
    setShopLicenseImage(profile?.shopLicenseImage ?? null);
    setAddress(profile?.address ?? '');
    setPostalCode(profile?.postalCode ?? '');
    setAccountKind(profile?.accountKind === 'SHOP' ? 'SHOP' : 'REGULAR');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }, [open, profile]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error('نام باید حداقل ۲ کاراکتر باشد');
      return;
    }

    const nationalDigits = nationalId ? normalizeTenDigits(nationalId) : '';
    if (nationalDigits && !IRAN_TEN_DIGIT_REGEX.test(nationalDigits)) {
      toast.error('کد ملی باید ۱۰ رقم باشد');
      return;
    }
    const postalDigits = postalCode ? normalizeTenDigits(postalCode) : '';
    if (postalDigits && !IRAN_TEN_DIGIT_REGEX.test(postalDigits)) {
      toast.error('کد پستی باید ۱۰ رقم باشد');
      return;
    }

    const wantsPasswordChange =
      currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

    if (wantsPasswordChange) {
      if (!currentPassword) {
        toast.error('رمز عبور فعلی را وارد کنید');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('رمز عبور جدید باید حداقل ۶ کاراکتر باشد');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('تکرار رمز عبور جدید با رمز جدید یکسان نیست');
        return;
      }
    }

    setSaving(true);
    try {
      if (wantsPasswordChange) {
        await api.users.changePassword({
          currentPassword,
          newPassword,
        });
      }

      const updated = await api.users.updateProfile({
        name: trimmedName,
        city: city.trim() || null,
        nationalId: nationalDigits || null,
        nationalIdCardImage,
        consentSelfieImage,
        shopLicenseImage,
        address: address.trim() || null,
        postalCode: postalDigits || null,
        accountKind,
      });
      patchUser({
        name: updated.name,
        city: updated.city ?? undefined,
      });
      onUpdated(updated);
      toast.success(
        wantsPasswordChange ? 'پروفایل و رمز عبور به‌روزرسانی شد' : 'پروفایل به‌روزرسانی شد',
      );
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'به‌روزرسانی پروفایل ناموفق بود');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">ویرایش پروفایل</span>
      </Button>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg pt-5">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>ویرایش پروفایل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name">نام</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام نمایشی"
                className="text-xs"
              />
            </div>
            <CitySelect value={city} onChange={setCity} label="شهر (اختیاری)" required={false} />
            <div className="space-y-2 border-t pt-4">
              <p className="text-sm font-medium">تغییر رمز عبور</p>
              <p className="text-muted-foreground text-xs">
                در صورت عدم نیاز به تغییر رمز، این فیلدها را خالی بگذارید.
              </p>
              <div className="space-y-2">
                <Label htmlFor="profile-current-password">رمز عبور فعلی</Label>
                <PasswordInput
                  id="profile-current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-new-password">رمز عبور جدید</Label>
                <PasswordInput
                  id="profile-new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-confirm-password">تکرار رمز عبور جدید</Label>
                <PasswordInput
                  id="profile-confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>نوع حساب (اختیاری)</Label>
              <div className="flex flex-wrap gap-2">
                {USER_ACCOUNT_KINDS.map((kind) => (
                  <Button
                    key={kind}
                    type="button"
                    size="sm"
                    variant={accountKind === kind ? 'default' : 'outline'}
                    onClick={() => setAccountKind(kind)}
                  >
                    {USER_ACCOUNT_KIND_LABELS[kind]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-national-id">کد ملی (اختیاری)</Label>
              <DigitsInput
                id="profile-national-id"
                inputMode="numeric"
                maxLength={10}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                placeholder="۱۰ رقم"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-postal">کد پستی (اختیاری)</Label>
              <DigitsInput
                id="profile-postal"
                inputMode="numeric"
                maxLength={10}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="۱۰ رقم"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-address">آدرس دقیق (اختیاری)</Label>
              <Textarea
                id="profile-address"
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="آدرس کامل محل سکونت یا فروشگاه"
              />
            </div>

            <ProfileDocImageField
              id="profile-national-card"
              label="عکس کارت ملی (اختیاری)"
              hint="پس از انتخاب، تصویر به WebP تبدیل و فشرده می‌شود."
              value={nationalIdCardImage}
              onChange={setNationalIdCardImage}
            />
            <ProfileDocImageField
              id="profile-consent-selfie"
              label="عکس رضایت سلفی (اختیاری)"
              hint="سلفی در حالی که کارت ملی و دست‌نوشته رضایت در دست دارید."
              value={consentSelfieImage}
              onChange={setConsentSelfieImage}
            />
            <ProfileDocImageField
              id="profile-shop-license"
              label="تصویر پروانه مغازه یا فروشگاه (اختیاری)"
              value={shopLicenseImage}
              onChange={setShopLicenseImage}
            />
          </div>
          <DialogFooter className="gap-1 border-t px-6 py-4 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
