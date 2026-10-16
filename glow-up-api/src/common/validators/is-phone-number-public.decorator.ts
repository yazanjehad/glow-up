
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsPhoneNumberPublic(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsPhoneNumberPublic',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;
          return /^\+?\d{9,13}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Phone number must be 9 to 13 digits and may start with + only';
        },
      },
    });
  };
}
