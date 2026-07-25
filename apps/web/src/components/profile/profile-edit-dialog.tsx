'use client';

import { normalizeTelegramIdInput } from '@offroad/shared';
import { Loader2, Pencil } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CitySelect } from '@/components/form/city-select';
import { TelegramIdInput } from '@/components/form/digits-input';
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
import { api } from '@/lib/api';
import { useAuth } from '@/stores/auth-store';

type ProfileEditDialogProps = {
  profile: { name?: string; city?: string | null; telegramId?: string | null } | null;
  onUpdated: (profile: { name: string; city?: string | null; telegramId?: string | null }) => void;
};

export function ProfileEditDialog({ profile, onUpdated }: ProfileEditDialogProps) {
  const { patchUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(profile?.name ?? '');
      setCity(profile?.city ?? '');
      setTelegramId(profile?.telegramId ? `@${profile.telegramId.replace(/^@/, '')}` : '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open, profile?.name, profile?.city, profile?.telegramId]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      toast.error('نام باید حداقل ۲ کاراکتر باشد');
      return;
    }

    const trimmedTelegram = normalizeTelegramIdInput(telegramId);
    if (
      trimmedTelegram &&
      !/^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(trimmedTelegram) &&
      !/^\d{5,15}$/.test(trimmedTelegram)
    ) {
      toast.error('آیدی تلگرام معتبر نیست (مثال: @username)');
      return;
    }

    const normalizedTelegram = trimmedTelegram ? trimmedTelegram.replace(/^@/, '') : null;

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
        city: city || undefined,
        telegramId: normalizedTelegram,
      });
      patchUser({
        name: updated.name,
        city: updated.city ?? undefined,
        telegramId: updated.telegramId ?? null,
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش پروفایل</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
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
            <CitySelect value={city} onChange={setCity} label="شهر" />
            <div className="space-y-2">
              <Label htmlFor="profile-telegram">
                آیدی تلگرام{' '}
                <span className="text-muted-foreground text-xs font-normal">
                  (جهت دریافت اعلان‌های چت و خبر)
                </span>
              </Label>
              <TelegramIdInput
                id="profile-telegram"
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="@username"
                autoComplete="off"
              />
            </div>
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
          </div>
          <DialogFooter className="gap-1 sm:gap-0">
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
