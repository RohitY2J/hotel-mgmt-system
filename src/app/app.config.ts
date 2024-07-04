import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { UrlSerializer, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import StandardUrlSerializer from './custom-url-serializer';

const customUrlSerializer = new StandardUrlSerializer();

const CustomUrlSerializerProvider = {
  provide: UrlSerializer,
  useValue: customUrlSerializer
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideHttpClient(),
    { provide: UrlSerializer, useClass: StandardUrlSerializer }
  ]
};
