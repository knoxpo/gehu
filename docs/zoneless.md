# Zoneless Angular

Gehu store accessors are Angular signals under `@gehu/angular`, so they work with
zoneless change detection with no extra wiring.

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideGehu } from '@gehu/angular';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideGehu({ zoneless: true }),
  ],
});
```

Remove `zone.js` from your `polyfills` in `angular.json`.

## Why it just works

`injectStore` builds the store with the Angular signal adapter, so
`store.count()` is an Angular signal. Reading it in a template registers a
reactive dependency; calling an action runs `set`, which updates that signal and
schedules change detection — no zone required.

Resources and mutations expose Angular signals too
(`store.user.loading()`), so their loading/error/status flow through zoneless CD
the same way.

See [`examples/angular-zoneless`](../examples/angular-zoneless).
