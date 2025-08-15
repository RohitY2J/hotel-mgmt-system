import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../env/environment';
import { from, lastValueFrom, Observable } from 'rxjs';
import axios from 'axios';

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

  httpGetAsync(path: string){
    //let accessToken = localStorage.getItem('accessToken');
    return lastValueFrom(this.httpClient.get<any>(`${ApiURL}/${path}`, {
      withCredentials: true,
    }));
  }

  httpPost(path: string, request: any) {
    return this.httpClient.post(`${ApiURL}/${path}`, request, {
      withCredentials: true,
    });
  }

  httpPostAsync(path: string, request: any){
    //let accessToken = localStorage.getItem('accessToken');
    return lastValueFrom(this.httpClient.post(`${ApiURL}/${path}`, request, {
       withCredentials: true
    }));
  }

  httpPostCAS(path: string, request: any) {
    return axios.post(`${environment.CAS_SERVER_URL}/api/${path}`, request, {
      withCredentials: true,
    });
  }

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
export const ApiURL = environment.SERVER_URL+"/api";