import { Component, OnInit } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { SupportedBrowserModel } from './SupportedBrowserModel';

@Component({
    selector: 'app-unsupported-browser',
    templateUrl: './unsupported-browser.component.html'
})
export class UnsupportedBrowserComponent implements OnInit {
    supportedBrowsers: SupportedBrowserModel[] = [];

    browserName: string;

    constructor(private deviceTypeService: DeviceTypeService) {
        this.browserName = this.deviceTypeService.getBrowserName();
        this.supportedBrowsers.push(new SupportedBrowserModel('Chrome', 'Chrome for Windows/Mac'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Firefox', 'Firefox for Windows/Mac'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Safari', 'Safari for Mac/iPad'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Edge Chromium', 'Edge Chromium for Windows'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Edge', 'Edge for Windows'));
    }

    ngOnInit() {}
}
