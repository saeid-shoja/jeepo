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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(profile?.name ?? '');
      setCity(profile?.city ?? '');
      setTelegramId(profile?.telegramId ? `@${profile.telegramId.replace(/^@/, '')}` : '');
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

    setSaving(true);
    try {
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
      toast.success('پروفایل به‌روزرسانی شد');
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
        ویرایش پروفایل
      </Button>

      <Dialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش پروفایل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">نام</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نام نمایشی"
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
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
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
