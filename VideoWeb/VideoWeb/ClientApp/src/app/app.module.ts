import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { API_BASE_URL} from "./services/clients/api-client";

import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { ConfigService } from './services/config.service';
import { AdalInterceptor, AdalService, AdalGuard } from 'adal-angular4';
import { AuthGuard } from './security/auth.gaurd';

export function getSettings(configService: ConfigService) {
  return () => configService.loadConfig();
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
    ]),
    SharedModule
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: getSettings, deps: [ConfigService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AdalInterceptor, multi: true },
    { provide: API_BASE_URL, useFactory: () => '.' },
    AdalService,
    AdalGuard,
    ConfigService,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
