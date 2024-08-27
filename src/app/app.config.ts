import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { UrlSerializer, provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import StandardUrlSerializer from './custom-url-serializer';

import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

const customUrlSerializer = new StandardUrlSerializer();

const CustomUrlSerializerProvider = {
  provide: UrlSerializer,
  useValue: customUrlSerializer
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideAnimations(), // required animations providers
    provideToastr(), 
    provideHttpClient(),
    { provide: UrlSerializer, useClass: StandardUrlSerializer }
  ]
};
