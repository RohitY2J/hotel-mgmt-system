import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HttpService {

  constructor(private httpClient: HttpClient) {
  }

  httpGet(path: string) {
    return this.httpClient.get<any>(`${ApiURL}/${path}`, {
      withCredentials: true,
    });
  }

  httpPost(path: string, request: any) {
    return this.httpClient.post(`${ApiURL}/${path}`, request, {
      withCredentials: true,
    });
  }
}
export const ApiURL = "http://localhost:8000/api"