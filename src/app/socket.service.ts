import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../env/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private readonly uri: string = environment.SERVER_URL; // Your server URL

  constructor() {
    this.socket = io(this.uri);
  }

  // Listen to order updates
  listenOrderUpdates(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('orderUpdated', (order) => {
        subscriber.next(order);
      });
    });
  }
}
