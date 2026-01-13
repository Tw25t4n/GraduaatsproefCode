// Added

import {
  Directive, 
  forwardRef,
} from '@angular/core';
import {
  AbstractControl,
  NG_VALIDATORS,
  ValidationErrors,
  Validator,
  ValidatorFn
} from '@angular/forms';

export const patternValidator = (pattern: RegExp, name: string): ValidatorFn =>
  control => pattern.test(control?.value) ? null : { [name]: { value: control?.value } };

export const minLengthValidator = (minLength: number, name: string): ValidatorFn =>
  control => control?.value?.length >= minLength
    ? null
    : { [name]: { requiredLength: minLength, actualLength: control?.value?.length } };

export const matchValidator = (matchTo: AbstractControl, name: string): ValidatorFn =>
  control => control?.value === matchTo?.value
    ? null
    : { [name]: { actual: control?.value, required: matchTo?.value } };

@Directive({
  selector: '[password-validator]',
  providers: [
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PasswordValidatorDirective),
      multi: true,
    },
  ],
})
export class PasswordValidatorDirective implements Validator {
  validate(group: AbstractControl): ValidationErrors | null {
    const [password, repeatNewPassword] = Object.values(group['controls']) as AbstractControl[];

    const validators: Array<(ctrl: AbstractControl) => ValidationErrors | null> = [
      minLengthValidator(12, "mustBeLongerThan12"),
      patternValidator(/[a-z]/, "mustContainLowercase"),
      patternValidator(/[A-Z]/, "mustContainUppercase"),
      patternValidator(/\d/, "mustContainDigit"),
      patternValidator(/[^a-zA-Z\d]/, "mustContainSpecialCharacter"),
      patternValidator(/^\S*$/, "cannotContainWhitespace"),
      matchValidator(repeatNewPassword, "passwordsMustMatch")
    ];

    return Object.assign({}, ...validators.map(fn => fn(password))) || null;
  }
}
