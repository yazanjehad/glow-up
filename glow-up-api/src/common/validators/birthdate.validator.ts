import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'BirthDateValidator', async: false })
export class BirthDateValidator implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return true;

    const birth = new Date(value);
    const today = new Date();


    if (birth > today) {
      return false;
    }

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age >= 13;
  }

  defaultMessage(args: ValidationArguments) {
    const birth = new Date(args.value);
    const today = new Date();

    if (birth > today) {
      return 'common.errors.BIRTHDATE_FUTURE_NOT_ALLOWED';
    }

    return 'common.errors.MINIMUM_AGE_13';
  }
}
