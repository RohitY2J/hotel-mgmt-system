import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function dateRangeValidator(startDateKey: string, endDateKey: string): ValidatorFn {
  return (formGroup: AbstractControl): ValidationErrors | null => {
    const startDate = formGroup.get(startDateKey)?.value;
    const endDate = formGroup.get(endDateKey)?.value;

    if (!startDate || !endDate) {
      return null; // If one of the dates is missing, the built-in required validator will handle it.
    }

    return startDate <= endDate ? null : { dateRangeInvalid: true };
  };
}