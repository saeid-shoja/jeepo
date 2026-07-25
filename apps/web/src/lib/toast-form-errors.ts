import type { FieldErrors, FieldValues } from 'react-hook-form';
import { toast } from 'sonner';

function collectErrorMessages(errors: FieldErrors<FieldValues>, out: string[] = []): string[] {
  for (const value of Object.values(errors)) {
    if (!value || typeof value !== 'object') continue;
    if ('message' in value && typeof value.message === 'string' && value.message) {
      out.push(value.message);
      continue;
    }
    collectErrorMessages(value as FieldErrors<FieldValues>, out);
  }
  return out;
}

/** Show react-hook-form validation errors as toast(s) on failed submit. */
export function toastFormValidationErrors(errors: FieldErrors<FieldValues>): void {
  const messages = [...new Set(collectErrorMessages(errors))];
  if (messages.length === 0) {
    toast.error('لطفاً فیلدهای فرم را بررسی کنید');
    return;
  }

  if (messages.length === 1) {
    toast.error(messages[0]);
    return;
  }

  toast.error('لطفاً خطاهای فرم را برطرف کنید', {
    description: messages.slice(0, 5).join('\n'),
  });
}
