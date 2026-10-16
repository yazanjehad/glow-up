import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsLocalPhone05(
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'IsLocalPhone05',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // must start with 05 and be exactly 10 digits
          return /^05\d{8}$/.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Phone number must start with 05 and contain exactly 10 digits';
        },
      },
    });
  };
}
