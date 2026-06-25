# Gehu · Angular zoneless

Zoneless change detection (no `zone.js`) with a Gehu async **resource**.

```sh
npm install
npm start        # ng serve → http://localhost:4200
npm run build
```

What it shows:

- [`provideZonelessChangeDetection()`](src/app/app.config.ts) + `provideGehu` —
  no `zone.js` in the build (`"polyfills": []` in `angular.json`)
- [an `autoRun` resource](src/app/users.store.ts) whose `loading()` / `data()` /
  `status()` signals drive the template under zoneless CD
- `@if`/`@else` control flow reacting to the resource signals

Because Gehu store accessors are Angular signals, no extra wiring is needed for
zoneless — reads register dependencies, `set` schedules change detection.
