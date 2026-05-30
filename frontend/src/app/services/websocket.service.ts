import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private ws!: WebSocket;
  messages$ = new Subject<any>();

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${location.host}/ws`);
    this.ws.onmessage = (event) => this.messages$.next(JSON.parse(event.data));
    this.ws.onclose = () => setTimeout(() => this.connect(), 3000);
    this.ws.onerror = () => this.ws.close();
  }
}
