import { containsLinkOrPhone, NO_CONTACT_IN_TEXT_MESSAGE } from '@offroad/shared';
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

export function NoContactInText(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'noContactInText',
      target: object.constructor,
      propertyName,
      options: { message: NO_CONTACT_IN_TEXT_MESSAGE, ...validationOptions },
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          if (value == null || value === '') return true;
          return typeof value === 'string' && !containsLinkOrPhone(value);
        },
      },
    });
  };
}
