import { VhoHearingsFilterComponent } from "./vho-hearings-filter.component";
import { HearingsFilterOptionsService } from "../services/hearings-filter-options.service";
import { HearingsFilter, StatusFilter, AlertFilter, AlertsStatus, ListFilter } from "../../shared/models/hearings-filter";
import { ConferenceStatus } from "../../services/clients/api-client";

describe('VhoHearingsFilterComponent', () => {
    const hearingFilter = new HearingsFilter();
    hearingFilter.statuses.push(new StatusFilter('In session', ConferenceStatus.InSession, false));
    hearingFilter.alerts.push(new AlertFilter('Disconnected', AlertsStatus.Disconnected, 'Disconnected', false));
    hearingFilter.locations.push(new ListFilter('Birmingham', false));

    let hearingsFilterOptionsServiceSpy: jasmine.SpyObj<HearingsFilterOptionsService>;
    hearingsFilterOptionsServiceSpy = jasmine.createSpyObj<HearingsFilterOptionsService>('HearingsFilterOptionsService',
        ['getFilter', 'setFilterOptions', 'countOptions', 'count']);
    hearingsFilterOptionsServiceSpy.getFilter.and.returnValue(hearingFilter);
    hearingsFilterOptionsServiceSpy.count.and.returnValue(0);
    hearingsFilterOptionsServiceSpy.countOptions.and.returnValue(3);

    const component = new VhoHearingsFilterComponent(hearingsFilterOptionsServiceSpy);

    it('should get selected filter options for All and apply filter is disabled', () => {
        component.ngOnInit();
        expect(component.hearingsFilter).toBeTruthy();
        expect(component.statusAllChecked).toBeTruthy();
        expect(component.alertsAllChecked).toBeTruthy();
        expect(component.locationAllChecked).toBeTruthy();
        expect(component.disableFilterApply).toBeTruthy();
    });
    it('should select filter status option and enable apply filter', () => {
        component.ngOnInit();
        component.statusOptionSelected(0);
        expect(component.statusAllChecked).toBeFalsy();
        expect(component.hearingsFilter.statuses[0].Selected).toBe(true);
        expect(component.disableFilterApply).toBe(false);
    });
    it('should select filter location option and enable apply filter', () => {
        component.ngOnInit();
        component.locationOptionSelected(0);
        expect(component.locationAllChecked).toBe(false);
        expect(component.hearingsFilter.locations[0].Selected).toBe(true);
        expect(component.disableFilterApply).toBe(false);
    });
    it('should select filter alerts option and enable apply filter', () => {
        component.ngOnInit();
        component.alertOptionSelected(0);
        expect(component.alertsAllChecked).toBe(false);
        expect(component.hearingsFilter.alerts[0].Selected).toBe(true);
        expect(component.disableFilterApply).toBe(false);
    });
    it('should select all status options', () => {
        component.ngOnInit();
        expect(component.statusAllChecked).toBeFalsy();
        component.statusAllSelected();
        expect(component.hearingsFilter.statuses[0].Selected).toBe(false);
        expect(component.statusAllChecked).toBe(true);
    });
    it('should select all location options', () => {
        component.ngOnInit();
        expect(component.locationAllChecked).toBe(false);
        component.locationAllSelected();
        expect(component.hearingsFilter.locations[0].Selected).toBe(false);
        expect(component.locationAllChecked).toBe(true);
    });
    it('should select all alerts options', () => {
        component.ngOnInit();
        expect(component.alertsAllChecked).toBe(false);
        component.alertAllSelected();
        expect(component.hearingsFilter.alerts[0].Selected).toBe(false);
        expect(component.alertsAllChecked).toBe(true);
    });
    it('should clear all selected filter options ', () => {
        component.statusOptionSelected(0);
        component.locationOptionSelected(0);
        component.alertOptionSelected(0);

        expect(component.alertsAllChecked).toBe(false);
        expect(component.locationAllChecked).toBe(false);
        expect(component.statusAllChecked).toBe(false);

        component.clearFilters();
        expect(component.alertsAllChecked).toBe(true);
        expect(component.locationAllChecked).toBe(true);
        expect(component.statusAllChecked).toBe(true);
    });
    it('shoould apply filter and set number selected filter options', () => {
    
        component.applyFilters();
        expect(component.hearingsFilter.numberFilterOptions).toBe(3);
    })
});
