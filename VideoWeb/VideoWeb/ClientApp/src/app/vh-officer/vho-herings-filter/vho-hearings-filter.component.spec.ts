import { ConferenceStatus } from '../../services/clients/api-client';
import { AlertFilter, AlertsStatus, HearingsFilter, StatusFilter } from '../../shared/models/hearings-filter';
import { HearingsFilterOptionsService } from '../services/hearings-filter-options.service';
import { VhoHearingsFilterComponent } from './vho-hearings-filter.component';

describe('VhoHearingsFilterComponent', () => {
    const hearingFilter = new HearingsFilter();
    let hearingsFilterOptionsServiceSpy: jasmine.SpyObj<HearingsFilterOptionsService>;
    let component: VhoHearingsFilterComponent;

    beforeAll(() => {
        hearingsFilterOptionsServiceSpy = jasmine.createSpyObj<HearingsFilterOptionsService>('HearingsFilterOptionsService', [
            'getFilter',
            'countOptions'
        ]);

        hearingFilter.statuses.push(new StatusFilter('In session', ConferenceStatus.InSession, false));
        hearingFilter.alerts.push(new AlertFilter('Disconnected', AlertsStatus.Disconnected, 'Disconnected', false));

        hearingsFilterOptionsServiceSpy.getFilter.and.returnValue(hearingFilter);
        hearingsFilterOptionsServiceSpy.countOptions.and.returnValue(2);

        component = new VhoHearingsFilterComponent(hearingsFilterOptionsServiceSpy);
    });

    beforeEach(() => {
        component.ngOnInit();
    });

    it('should get selected filter options for All and apply filter is disabled', () => {
        expect(component.hearingsFilter).toBeTruthy();
        expect(component.statusAllChecked).toBeTruthy();
        expect(component.alertsAllChecked).toBeTruthy();
        expect(component.disableFilterApply).toBeTruthy();
    });
    it('should select filter status option and enable apply filter', () => {
        component.statusOptionSelected(0);
        expect(component.statusAllChecked).toBeFalsy();
        expect(component.hearingsFilter.statuses[0].Selected).toBe(true);
        expect(component.disableFilterApply).toBe(false);
    });
    it('should select filter alerts option and enable apply filter', () => {
        component.alertOptionSelected(0);
        expect(component.alertsAllChecked).toBe(false);
        expect(component.hearingsFilter.alerts[0].Selected).toBe(true);
        expect(component.disableFilterApply).toBe(false);
    });
    it('should select all status options', () => {
        expect(component.statusAllChecked).toBeFalsy();
        component.statusAllSelected();
        expect(component.hearingsFilter.statuses[0].Selected).toBe(false);
        expect(component.statusAllChecked).toBe(true);
    });
    it('should select all alerts options', () => {
        expect(component.alertsAllChecked).toBe(false);
        component.alertAllSelected();
        expect(component.hearingsFilter.alerts[0].Selected).toBe(false);
        expect(component.alertsAllChecked).toBe(true);
    });
    it('should clear all selected filter options ', () => {
        component.statusOptionSelected(0);
        component.alertOptionSelected(0);

        expect(component.alertsAllChecked).toBe(false);
        expect(component.statusAllChecked).toBe(false);

        component.clearFilters();
        expect(component.alertsAllChecked).toBe(true);
        expect(component.statusAllChecked).toBe(true);
    });
    it('should apply filter and set number selected filter options', () => {
        component.applyFilters();
        expect(component.hearingsFilter.numberFilterOptions).toBe(2);
    });
});
