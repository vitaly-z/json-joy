import {Defer} from 'thingies/es2020/Defer';
import {RespEncoder} from '../json-pack/resp';
import {RespStreamingDecoder} from '../json-pack/resp/RespStreamingDecoder';
import {ReconnectingSocket} from './ReconnectingSocket';

export interface RedisClientOpts {
  socket: ReconnectingSocket;
  encoder: RespEncoder;
  decoder: RespStreamingDecoder;
}

export class RedisClient {
  protected readonly socket: ReconnectingSocket;
  protected readonly encoder: RespEncoder;
  protected readonly decoder: RespStreamingDecoder;
  protected readonly responses: Defer<unknown>[] = [];
  protected decodingTimer?: NodeJS.Immediate = undefined;

  public readonly onProtocolError = new Defer<Error>();

  constructor(opts: RedisClientOpts) {
    const socket = this.socket = opts.socket;
    this.encoder = opts.encoder;
    const decoder = this.decoder = opts.decoder;
    socket.onData.listen((data) => {
      decoder.push(data);
      this.scheduleDecoding();
    });
    socket.onError.listen((err: Error) => {
      console.log('err', err);
    });
  }

  protected scheduleDecoding() {
    if (this.decodingTimer) return;
    this.decodingTimer = setImmediate(this.handleDecoding);
  }

  private readonly handleDecoding = () => {
    this.decodingTimer = undefined;
    const decoder = this.decoder;
    let msg;
    let i = 0;
    const responses = this.responses;
    while ((msg = decoder.read()) !== undefined) {
      const defer = responses[i++];
      if (!defer) {
        this.onProtocolError.reject(new Error('UNEXPECTED_RESPONSE'));
        // TODO: reconnect socket ...
        // TODO: clear client state ...
        return;
      }
      if (msg instanceof Error) defer.reject(msg); else defer.resolve(msg);
    }
    if (i > 0) responses.splice(0, i);
  };

  public start() {
    this.socket.start();
  }

  public stop() {
    this.socket.stop();
  }

  public async cmd(args: unknown[]): Promise<unknown> {
    const defer = new Defer<unknown>();
    this.responses.push(defer);
    const buf = this.encoder.encodeCmd(args);
    this.socket.write(buf);
    return defer.promise;
  }

  public async cmdUtf8(args: unknown[]): Promise<unknown> {
    throw new Error('TODO');
  }
}
