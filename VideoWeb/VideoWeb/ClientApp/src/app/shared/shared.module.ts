import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DeviceDetectorModule } from 'ngx-device-detector';

import { ContactUsComponent } from './contact-us/contact-us.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { PaginationComponent } from './pagination/pagination.component';
import { SharedRoutingModule } from './shared-routing.module';
import { ContactUsFoldingComponent } from './contact-us-folding/contact-us-folding.component';
import { SnotifyModule, ToastDefaults, SnotifyService } from 'ng-snotify';
import { ErrorComponent } from './error/error.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { SelectMediaDevicesComponent } from './select-media-devices/select-media-devices.component';
import { MicVisualiserComponent } from '../shared/mic-visualiser/mic-visualiser.component';
import { EquipmentProblemComponent } from './equipment-problem/equipment-problem.component';
import { SelfTestComponent } from './self-test/self-test.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SharedRoutingModule,
    SnotifyModule,
    DeviceDetectorModule.forRoot()
  ],
  declarations: [
    HeaderComponent,
    FooterComponent,
    ContactUsComponent,
    PaginationComponent,
    ContactUsFoldingComponent,
    ErrorComponent,
    NotFoundComponent,
    SelectMediaDevicesComponent,
    MicVisualiserComponent,
    EquipmentProblemComponent,
    SelfTestComponent
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
    SelectMediaDevicesComponent,
    MicVisualiserComponent,
    SelfTestComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    SnotifyModule,
    DeviceDetectorModule
  ]
})
export class SharedModule { }
