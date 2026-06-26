import { ChangeDetectionStrategy, Component } from "@angular/core";
import { injectStore } from "@gehu-js/angular";
import { counterStore } from "./counter.store";

@Component({
	selector: "app-home",
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
    <main style="font-family: system-ui; max-width: 26rem; margin: 4rem auto; text-align: center">
      <h1>Gehu · SSR + hydration</h1>
      <p style="font-size: 3rem; margin: 0.5rem">{{ counter.count() }}</p>
      <p style="color: #666">double = {{ counter.double() }}</p>
      <p style="color: #888; font-size: 0.85rem">
        rendered on the server with count = 42, transferred and hydrated on the client.
      </p>
      <div style="display: flex; gap: 0.5rem; justify-content: center">
        <button (click)="counter.inc()">+</button>
        <button (click)="counter.reset()">reset</button>
      </div>
    </main>
  `,
})
export class HomeComponent {
	counter = injectStore(counterStore);
}
