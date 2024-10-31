import type {PeritextEventTarget} from '../events/PeritextEventTarget';
import type {UiLifeCycles} from './types';
import type {Peritext} from '../../json-crdt-extensions/peritext';

export interface RichTextControllerOpts {
  source: HTMLElement;
  txt: Peritext;
  et: PeritextEventTarget;
}

export class RichTextController implements UiLifeCycles {
  public constructor(public readonly opts: RichTextControllerOpts) {}

  /** -------------------------------------------------- {@link UiLifeCycles} */

  public start(): void {
    const el = this.opts.source;
    el.addEventListener('keydown', this.onKeyDown);
  }

  public stop(): void {
    const el = this.opts.source;
    el.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    const key = event.key;
    const et = this.opts.et;
    if (key === 'b' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      et.inline({type: 'b'});
      return;
    }
    if (key === 'i' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      et.inline({type: 'i'});
      return;
    }
  };
}
