import { ChangeDetectionStrategy, Component } from '@angular/core';
import { injectStore } from '@gehu/angular';
import { usersStore } from './users.store';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main style="font-family: system-ui; max-width: 26rem; margin: 4rem auto; text-align: center">
      <h1>Gehu · Zoneless + resource</h1>
      <div style="display: flex; gap: 0.5rem; justify-content: center">
        <button (click)="users.select('1')">Load #1</button>
        <button (click)="users.select('2')">Load #2</button>
      </div>

      @if (users.user.loading()) {
        <p style="color: #888">loading…</p>
      } @else if (users.user.data(); as user) {
        <p style="font-size: 1.5rem">{{ user.name }} <small>(#{{ user.id }})</small></p>
      } @else {
        <p style="color: #888">pick a user</p>
      }

      <p style="color: #aaa; font-size: 0.8rem">status: {{ users.user.status() }} · no zone.js</p>
    </main>
  `,
})
export class AppComponent {
  users = injectStore(usersStore);
}
