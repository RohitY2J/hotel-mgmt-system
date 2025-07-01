import { TestBed } from '@angular/core/testing';
import { ConstantsService } from './constants.service';
import { FormBuilder, FormGroup } from '@angular/forms';

describe('ConstantsService', () => {
  let service: ConstantsService;
  let formBuilder: FormBuilder;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConstantsService, FormBuilder]
    });
    service = TestBed.inject(ConstantsService);
    formBuilder = TestBed.inject(FormBuilder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getStatusString', () => {
    it('should return the correct status string for a valid key and code', () => {
      const status = service.getStatusString('attendanceStatus', 1);
      expect(status).toBe('Present');
    });

    it('should return "Unknown" for an invalid key', () => {
      const status = service.getStatusString('invalidKey' as any, 1);
      expect(status).toBe('Unknown');
    });

    it('should return "Unknown" for an invalid code', () => {
      const status = service.getStatusString('attendanceStatus', 999);
      expect(status).toBe('Unknown');
    });
  });

  describe('getStatusValuesAsDictionary', () => {
    it('should return the correct dictionary for a valid key', () => {
      const dictionary = service.getStatusValuesAsDictionary('attendanceStatus');
      expect(dictionary).toEqual([
        { key: 0, value: 'Scheduled' },
        { key: 1, value: 'Present' },
        { key: 2, value: 'Absent' },
        { key: 3, value: 'On Leave' }
      ]);
    });

    it('should return an empty array for an invalid key', () => {
      const dictionary = service.getStatusValuesAsDictionary('invalidKey' as any);
      expect(dictionary).toEqual([]);
    });
  });

  describe('markFormGroupTouched', () => {
    it('should mark all controls as touched in a form group, including nested controls', () => {
      const formGroup = formBuilder.group({
        control1: [''],
        control2: formBuilder.group({
          subControl: ['']
        })
      });

      service.markFormGroupTouched(formGroup);

      expect(formGroup.get('control1')?.touched).toBeTrue();
      expect(formGroup.get('control2.subControl')?.touched).toBeTrue();
    });
  });

  describe('getDateTodayString', () => {
    it('should return today\'s date in MM/DD/YYYY format', () => {
      const dateString = service.getDateTodayString();
      const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
      expect(dateString).toMatch(regex);
    });
  });
});