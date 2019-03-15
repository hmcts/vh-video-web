import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { API_BASE_URL} from './services/clients/api-client';

import { SharedModule } from './shared/shared.module';

import { AppComponent } from './app.component';
import { ConfigService } from './services/config.service';
import { AdalInterceptor, AdalService, AdalGuard } from 'adal-angular4';
import { AuthGuard } from './security/auth.gaurd';
import {AppRoutingModule} from './app-routing.module';
import {SecurityModule} from './security/security.module';
import { HomeComponent } from './home/home.component';
import { DeclarationComponent } from './declaration/declaration.component';

export function getSettings(configService: ConfigService) {
  return () => configService.loadConfig();
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DeclarationComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    SharedModule,
    SecurityModule,
    AppRoutingModule
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
