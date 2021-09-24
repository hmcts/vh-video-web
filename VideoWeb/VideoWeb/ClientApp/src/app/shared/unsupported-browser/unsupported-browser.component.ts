import { Component } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { SupportedBrowserModel } from './SupportedBrowserModel';

@Component({
    selector: 'app-unsupported-browser',
    templateUrl: './unsupported-browser.component.html'
})
export class UnsupportedBrowserComponent {
    supportedBrowsers: SupportedBrowserModel[] = [
        new SupportedBrowserModel('Chrome', 'Chrome for Windows, Mac, Android phone, Android tablet, iPhone and iPad'),
        new SupportedBrowserModel('Firefox', 'Firefox for Windows and Mac'),
        new SupportedBrowserModel('Safari', 'Safari for Mac, iPhone and iPad'),
        new SupportedBrowserModel('Edge Chromium', 'Edge for Windows'),
        new SupportedBrowserModel('Samsung', 'Samsung browser for Android phone and Android tablet')
    ];
    browserName: string;

    constructor(private deviceTypeService: DeviceTypeService) {
        this.browserName = this.deviceTypeService.getBrowserName();
    }
}
