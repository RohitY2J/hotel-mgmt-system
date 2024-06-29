import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  _httpClient: HttpClient;
  
  constructor(httpClient: HttpClient) { 
    this._httpClient = httpClient;
  }

  httpGet(path: string){
      return this._httpClient.get(`${ApiURL}/${path}`);
  }
  httpPost(path: string, request: any){
    return this._httpClient.post(`${ApiURL}/${path}`, request, { withCredentials: true });
  }
}
export const ApiURL = "http://localhost:8000/api"