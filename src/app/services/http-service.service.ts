import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../env/environment';
import { from, Observable } from 'rxjs';

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

  // httpPostCAS(path: string, request: any) {
  //   return this.httpClient.post(`${environment.casServerUrl}/api/${path}`, request, {
  //     withCredentials: true,
  //   });
  // }

  // httpPostCAS(path: string, request: any): Observable<any> {
  //   return from(
  //     axios.post(`${environment.casServerUrl}/api/${path}`, request, {
  //       withCredentials: true,
  //       headers: {
  //         'Origin': this.clientOrigin,
  //         'Content-Type': 'application/json'
  //       }
  //     }).then(response => response.data)
  //   );
  // }
}
export const ApiURL = environment.serverUrl+"/api";