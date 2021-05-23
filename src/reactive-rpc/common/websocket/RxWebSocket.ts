import {Subject, ReplaySubject} from 'rxjs';
import {WebSocketState} from './constants';
import {RxWebSocketBase} from './types';

export interface RxWebSocketParams {
  newSocket: () => RxWebSocketBase;
}

export class RxWebSocket {
  /**
   * Native websocket reference, or `undefined` if construction of websocket
   * failed.
   */
  public readonly ws: RxWebSocketBase | undefined;

  /**
   * Emits once when WebSocket transitions into "OPEN" state.
   */
  public readonly open$ = new ReplaySubject<RxWebSocket>(1);

  /**
   * Emits once when WebSocket is closed or when construction of Websocket
   * throws.
   */
  public readonly close$ = new ReplaySubject<RxWebSocket>(1);

  /**
   * Emits WebSocket errors.
   */
  public readonly error$ = new Subject<Event>();

  /**
   * Emits all WebSocket incoming message data payloads.
   */
  public readonly message$ = new Subject<string | ArrayBuffer>();

  constructor({newSocket}: RxWebSocketParams) {
    try {
      this.ws = newSocket();
      this.ws.onopen = () => {
        this.open$.next(this);
        this.open$.complete();
      };
      this.ws.onclose = () => {
        this.close$.next(this);
        this.close$.complete();
        this.message$.complete();
      };
      this.ws.onerror = (event: Event) => this.error$.next(event);
      this.ws.onmessage = (event) => this.message$.next(event.data);
    } catch (error) {
      this.error$.next(error);
      this.close$.next(this);
      this.close$.complete();
    }
  }

  public state(): WebSocketState {
    return this.ws ? this.ws.readyState : WebSocketState.CLOSED;
  }

  public isConnecting(): boolean {
    return this.state() === WebSocketState.CONNECTING;
  }

  public isOpen(): boolean {
    return this.state() === WebSocketState.OPEN;
  }

  public isClosing(): boolean {
    return this.state() === WebSocketState.CLOSING;
  }

  public isClosed(): boolean {
    return this.state() === WebSocketState.CLOSED;
  }

  public buffer(): number {
    if (!this.ws) return 0;
    return this.ws.bufferedAmount;
  }

  public close(code?: number, reason?: string): void {
    if (!this.ws) return;
    this.ws.close(code, reason);
  }
  
  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): number {
    if (!this.ws) return -1;
    const buffered = this.ws.bufferedAmount;
    this.ws.send(data);
    return this.ws.bufferedAmount - buffered;
  }
}
