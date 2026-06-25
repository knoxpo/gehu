import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectStore } from '@gehu/angular';
import { counterStore } from './counter.store';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="font-family: system-ui; max-width: 24rem; margin: 4rem auto; text-align: center">
      <h1>Gehu · Angular basic</h1>
      <p style="font-size: 3rem; margin: 0.5rem">{{ counter.count() }}</p>
      <p style="color: #666">double = {{ counter.double() }}</p>
      <div style="display: flex; gap: 0.5rem; justify-content: center">
        <button (click)="counter.dec()">−</button>
        <button (click)="counter.inc()">+</button>
        <button (click)="counter.reset()">reset</button>
      </div>
    </main>
  `,
})
export class AppComponent {
  counter = injectStore(counterStore);
}
