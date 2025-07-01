import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpService } from './http-service.service';
import { environment } from '../../../env/environment';

describe('HttpService', () => {
  let service: HttpService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HttpService]
    });

    service = TestBed.inject(HttpService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make a GET request with the correct URL and options', () => {
    const testPath = 'test-path';
    const expectedUrl = `${environment.serverUrl}/api/${testPath}`;

    service.httpGet(testPath).subscribe();

    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);

    req.flush({});
  });

  it('should return the response from the GET request', () => {
    const testPath = 'test-path';
    const expectedResponse = { data: 'test data' };
    const expectedUrl = `${environment.serverUrl}/api/${testPath}`;

    service.httpGet(testPath).subscribe(response => {
      expect(response).toEqual(expectedResponse);
    });

    const req = httpTestingController.expectOne(expectedUrl);
    req.flush(expectedResponse);
  });

  it('should handle errors from the GET request', () => {
    const testPath = 'test-path';
    const expectedUrl = `${environment.serverUrl}/api/${testPath}`;
    const errorMessage = 'Test error';

    service.httpGet(testPath).subscribe(
      () => fail('should have failed with an error'),
      (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe(errorMessage);
      }
    );

    const req = httpTestingController.expectOne(expectedUrl);
    req.flush(errorMessage, { status: 500, statusText: errorMessage });
  });

  it('should make a POST request with the correct URL, body, and options', () => {
    const testPath = 'test-path';
    const testRequest = { key: 'value' };
    const expectedUrl = `${environment.serverUrl}/api/${testPath}`;

    service.httpPost(testPath, testRequest).subscribe();

    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(testRequest);
    expect(req.request.withCredentials).toBe(true);

    req.flush({});
  });

  it('should return the response from the POST request', () => {
    const testPath = 'test-path';
    const testRequest = { key: 'value' };
    const expectedResponse = { result: 'success' };
    const expectedUrl = `${environment.serverUrl}/api/${testPath}`;

    service.httpPost(testPath, testRequest).subscribe(response => {
      expect(response).toEqual(expectedResponse);
    });

    const req = httpTestingController.expectOne(expectedUrl);
    req.flush(expectedResponse);
  });

  it('should handle errors from the POST request', () => {
    const testPath = 'test-path';
    const testRequest = { key: 'value' };
    const expectedUrl = `${environment.serverUrl}/api/${testPath}`;
    const errorMessage = 'Test error';

    service.httpPost(testPath, testRequest).subscribe(
      () => fail('should have failed with an error'),
      (error) => {
        expect(error.status).toBe(500);
        expect(error.statusText).toBe(errorMessage);
      }
    );

    const req = httpTestingController.expectOne(expectedUrl);
    req.flush(errorMessage, { status: 500, statusText: errorMessage });
  });
});