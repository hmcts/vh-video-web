import { Component, OnInit } from '@angular/core';
import { DeviceTypeService } from 'src/app/services/device-type.service';
import { SupportedBrowserModel } from './SupportedBrowserModel';

@Component({
    selector: 'app-unsupported-browser',
    templateUrl: './unsupported-browser.component.html',
    styleUrls: ['./unsupported-browser.component.scss']
})
export class UnsupportedBrowserComponent implements OnInit {
    supportedBrowsers: SupportedBrowserModel[] = [];

    browserName: string;

    constructor(private deviceTypeService: DeviceTypeService) {
        this.browserName = this.deviceTypeService.getBrowserName();
        this.supportedBrowsers.push(new SupportedBrowserModel('Chrome'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Firefox'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Safari'));
        this.supportedBrowsers.push(new SupportedBrowserModel('Edge'));
    }

    ngOnInit() {}
}
