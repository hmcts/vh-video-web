import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';

@Directive({
    standalone: false,
    selector: '[appDesktopOnly]'
})
export class DesktopOnlyDirective {
    constructor(
        private templateRef: TemplateRef<any>,
        private viewContainer: ViewContainerRef,
        private deviceTypeService: DeviceTypeService
    ) {
        if (this.deviceTypeService.isDesktop()) {
            this.viewContainer.createEmbeddedView(this.templateRef);
        } else {
            this.viewContainer.clear();
        }
    }
}
