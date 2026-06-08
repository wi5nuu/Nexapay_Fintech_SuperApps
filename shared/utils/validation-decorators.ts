import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Decorator to ensure a property matches another property in the same object.
 * Example: @Match('password') confirmPassword: string;
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.propertyName} must match ${relatedPropertyName}`;
  }
}

/**
 * Decorator to ensure a date property is after another date property.
 * Example: @IsAfter('startDate') endDate: Date;
 */
export function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'IsAfter' })
export class IsAfterConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    if (!(value instanceof Date) || !(relatedValue instanceof Date)) {
      return true; // Let other validators handle types
    }
    return value.getTime() > relatedValue.getTime();
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.propertyName} must be after ${relatedPropertyName}`;
  }
}
