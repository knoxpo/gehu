import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideGehu } from '@gehu/angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // no zone.js
    provideGehu({ zoneless: true }),
  ],
};
