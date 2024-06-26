import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HttpServiceService {

  _httpClient: HttpClient;
  constructor(httpClient: HttpClient) { 
    this._httpClient = httpClient;
  }

  httpGet(path: string){
      return this._httpClient.get(path);
  }
  httpPost(path: string, request: any){
    return this._httpClient.post(path, request);
  }
}
