// https://github.com/scttcper/ngx-toastr/issues/339#issuecomment-508750488
import { Injectable, NgModule } from '@angular/core';
import { IndividualConfig, ToastPackage, ToastRef, ToastrModule } from 'ngx-toastr';
import { TestBed } from '@angular/core/testing';

@Injectable()
class MockToastPackage extends ToastPackage {
    constructor() {
        const toastConfig = { toastClass: 'custom-toast' };
        super(1, <IndividualConfig>toastConfig, 'test message', 'test title', 'show', new ToastRef(null));
    }
}

@NgModule({
    providers: [{ provide: ToastPackage, useClass: MockToastPackage }],
    imports: [ToastrModule.forRoot()],
    exports: [ToastrModule]
})
export class ToastrTestingModule {}
