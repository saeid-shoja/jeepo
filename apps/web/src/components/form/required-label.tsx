import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type RequiredLabelProps = React.ComponentProps<typeof Label> & {
  required?: boolean;
};

export function RequiredLabel({
  required = true,
  className,
  children,
  ...props
}: RequiredLabelProps) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required && <span className="text-destructive">* </span>}
    </Label>
  );
}
