import { Injectable } from '@angular/core';
import { BROWSERS, DeviceDetectorService, OS } from 'ngx-device-detector';
import { browsers } from '../shared/browser.constants';

@Injectable({
    providedIn: 'root'
})
export class DeviceTypeService {
    constructor(private deviceDetectorService: DeviceDetectorService) {}

    isMobile(): boolean {
        return this.deviceDetectorService.isMobile();
    }

    isTablet(): boolean {
        return this.deviceDetectorService.isTablet();
    }

    isDesktop(): boolean {
        return this.deviceDetectorService.isDesktop();
    }

    isIpad(): boolean {
        return (
            this.deviceDetectorService.isTablet() &&
            this.isIOS() &&
            this.deviceDetectorService.browser.toLowerCase() === BROWSERS.SAFARI.toLowerCase()
        );
    }

    isIOS(): boolean {
        return (
            this.deviceDetectorService.os.toLowerCase() === OS.MAC.toLowerCase() ||
            this.deviceDetectorService.os.toLowerCase() === OS.IOS.toLowerCase()
        );
    }

    isAndroid(): boolean {
        return this.deviceDetectorService.os.toLowerCase() === OS.ANDROID.toLowerCase();
    }

    isSupportedBrowser(): boolean {
        const supportedBrowsers = [
            browsers.Firefox,
            browsers.Safari,
            browsers.Chrome,
            browsers.MSEdge,
            browsers.MSEdgeChromium,
            browsers.Samsung
        ];
        const browser = this.deviceDetectorService.browser;
        const supportedIOSBrowsers = [browsers.Safari];

        if (this.isIOS() && !this.isDesktop()) {
            return supportedIOSBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
        }
        return supportedBrowsers.findIndex(x => x.toUpperCase() === browser.toUpperCase()) > -1;
    }

    getBrowserName(): string {
        return this.deviceDetectorService.browser;
    }

    getBrowserVersion(): string {
        return this.deviceDetectorService.browser_version;
    }

    getOSName(): string {
        return this.deviceDetectorService.os;
    }

    getOSVersion(): string {
        return this.deviceDetectorService.os_version;
    }
}