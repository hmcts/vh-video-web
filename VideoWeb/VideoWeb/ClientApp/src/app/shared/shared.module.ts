import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SharedRoutingModule } from './shared-routing.module';
import { ContactUsFoldingComponent } from './contact-us-folding/contact-us-folding.component';
import { SnotifyModule, ToastDefaults, SnotifyService } from 'ng-snotify';
import { ErrorComponent } from './error/error.component';
import { NotFoundComponent } from './not-found/not-found.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SharedRoutingModule,
    SnotifyModule
  ],
  declarations: [
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    PaginationComponent,
    ContactUsFoldingComponent,
    ErrorComponent,
    NotFoundComponent
  ],
  providers: [
    { provide: 'SnotifyToastConfig', useValue: ToastDefaults},
    SnotifyService
  ],
  exports: [
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    ContactUsFoldingComponent,
    PaginationComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SnotifyModule
  ]
})
export class SharedModule { }
