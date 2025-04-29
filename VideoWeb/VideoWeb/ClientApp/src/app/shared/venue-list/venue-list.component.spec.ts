import { Router } from '@angular/router';
import { of } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { HearingVenueResponse, JusticeUserResponse, Role, UserProfileResponse } from 'src/app/services/clients/api-client';
import { Logger } from 'src/app/services/logging/logger-base';
import { SessionStorage } from 'src/app/services/session-storage';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { VhoQueryService } from 'src/app/vh-officer/services/vho-query-service.service';
import { CourtRoomsAccounts } from '../../vh-officer/services/models/court-rooms-accounts';
import { VhoStorageKeys } from '../../vh-officer/services/models/session-keys';
import { VenueListComponentDirective } from './venue-list.component';
import { FEATURE_FLAGS, LaunchDarklyService } from '../../services/launch-darkly.service';
import { ProfileService } from 'src/app/services/api/profile.service';
import { CsoFilter } from 'src/app/vh-officer/services/models/cso-filter';
import { fakeAsync, tick } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';

class MockedVenueListComponent extends VenueListComponentDirective {
    get showVhoSpecificContent() {
        return true;
    }

    goToHearingList() {}
}

describe('VenueListComponent', () => {
    let component: VenueListComponentDirective;
    let videoWebServiceSpy: jasmine.SpyObj<VideoWebService>;
    let router: jasmine.SpyObj<Router>;
    let vhoQueryService: jasmine.SpyObj<VhoQueryService>;
    let launchDarklyServiceSpy: jasmine.SpyObj<LaunchDarklyService>;
    let translateServiceSpy: jasmine.SpyObj<TranslateService>;
    const logger: Logger = new MockLogger();
    let profileServiceSpy: jasmine.SpyObj<ProfileService>;

    const venueSessionStorage = new SessionStorage<string[]>(VhoStorageKeys.VENUE_ALLOCATIONS_KEY);
    const csoSessionStorage = new SessionStorage<CsoFilter>(VhoStorageKeys.CSO_ALLOCATIONS_KEY);

    const venueNames: HearingVenueResponse[] = [];
    const venueName1 = new HearingVenueResponse({ id: 1, name: 'Birmingham' });
    const venueName2 = new HearingVenueResponse({ id: 2, name: 'Manchester' });
    const venueName3 = new HearingVenueResponse({ id: 3, name: 'Taylor House' });
    venueNames.push(venueName1);
    venueNames.push(venueName2);
    venueNames.push(venueName3);

    const selectedJudgeNames: string[] = [];
    selectedJudgeNames.push(venueName1.name);
    selectedJudgeNames.push(venueName2.name);
    selectedJudgeNames.push(venueName3.name);

    const venueAccounts1 = new CourtRoomsAccounts('Birmingham', ['Room 01', 'Room 02'], false);
    const venueAccounts2 = new CourtRoomsAccounts('Manchester', ['Room 01', 'Room 02'], false);
    const venueAccounts: CourtRoomsAccounts[] = [];
    venueAccounts.push(venueAccounts1);
    venueAccounts.push(venueAccounts2);

    const loggedInUser = new UserProfileResponse({ username: 'loggedIn@email.com', roles: [Role.Administrator] });
    const csos: JusticeUserResponse[] = [];
    const csoAllocatedToMe = new JusticeUserResponse({
        id: VenueListComponentDirective.ALLOCATED_TO_ME,
        first_name: 'Allocated to me',
        full_name: 'Allocated to me'
    });
    const csoUnallocated = new JusticeUserResponse({
        id: VenueListComponentDirective.UNALLOCATED,
        first_name: 'Unallocated',
        full_name: 'Unallocated'
    });
    const cso1 = new JusticeUserResponse({
        id: '123',
        first_name: 'Test',
        full_name: 'Cso',
        username: loggedInUser.username
    });
    csos.push(csoAllocatedToMe);
    csos.push(csoUnallocated);
    csos.push(cso1);

    beforeAll(() => {
        videoWebServiceSpy = jasmine.createSpyObj<VideoWebService>('VideoWebService', ['getVenues']);
        router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
        launchDarklyServiceSpy = jasmine.createSpyObj<LaunchDarklyService>('LaunchDarklyService', ['getFlag']);
        translateServiceSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
        profileServiceSpy = jasmine.createSpyObj<ProfileService>('ProfileService', [
            'checkCacheForProfileByUsername',
            'getProfileByUsername',
            'getUserProfile'
        ]);
    });

    beforeEach(() => {
        component = new MockedVenueListComponent(
            videoWebServiceSpy,
            router,
            vhoQueryService,
            logger,
            launchDarklyServiceSpy,
            profileServiceSpy,
            translateServiceSpy
        );
        videoWebServiceSpy.getVenues.and.returnValue(of(venueNames));
        launchDarklyServiceSpy.getFlag.withArgs(FEATURE_FLAGS.activeSessionFilter, jasmine.any(Boolean)).and.returnValue(of(true));
        profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(loggedInUser));
        translateServiceSpy.instant.and.callFake((key: string) => {
            switch (key) {
                case 'venue-list.allocation-list-label':
                    return 'Venue selection list';
                case 'venue-list.cso-selection-list-label':
                    return 'Cso officer list';
            }
        });
        component.csos = csos;
        venueSessionStorage.clear();
        csoSessionStorage.clear();
    });

    it('should retrieve and populate venues on init', () => {
        expect(component.venues).toBeUndefined();
        component.ngOnInit();
        expect(component.venues).toBeDefined();
    });

    it('should return false when no allocations are selected', () => {
        component.selectedVenues = [];
        expect(component.venuesSelected).toBeFalsy();
    });

    it('should return true when allocations are selected', () => {
        component.selectedVenues = [venueNames[0].name];
        expect(component.venuesSelected).toBeTruthy();
    });

    describe('updateCsoSelection', () => {
        it('should update storage with selection', fakeAsync(() => {
            component.selectedVenues = [venueNames[0].name];
            component.updateVenueSelection();
            component.selectedCsos = [csoAllocatedToMe.id, csoUnallocated.id, cso1.id];
            component.updateCsoSelection();
            tick();

            expect(component.selectedVenues.length).toBe(0);
            const venueAllocation = venueSessionStorage.get();
            expect(venueAllocation).toBeNull();
            const csoFilter = csoSessionStorage.get();
            expect(csoFilter).not.toBeNull();
            expect(csoFilter.allocatedCsoIds.length).toBe(1);
            expect(csoFilter.allocatedCsoIds).toEqual([cso1.id]);
            expect(csoFilter.includeUnallocated).toBeTrue();
        }));

        it('should ignore case of username when looking up the user', fakeAsync(() => {
            const user = { ...loggedInUser } as UserProfileResponse;
            user.username = loggedInUser.username.toUpperCase();
            profileServiceSpy.getUserProfile.and.returnValue(Promise.resolve(user));
            component.selectedCsos = [csoAllocatedToMe.id];
            component.updateCsoSelection();
            tick();

            const csoFilter = csoSessionStorage.get();
            expect(csoFilter.allocatedCsoIds.length).toBe(1);
            expect(csoFilter.allocatedCsoIds).toEqual([cso1.id]);
        }));
    });

    describe('updateActiveSessionSelection', () => {
        it('should clear all selections when active sessions is true', () => {
            component.selectedVenues = [venueNames[0].name];
            component.selectedCsos = [cso1.id];
            component.updateActiveSessionSelection();
            expect(component.selectedVenues.length).toBe(0);
            expect(component.selectedCsos.length).toBe(0);
            expect(csoSessionStorage.get()).toBeNull();
            expect(venueSessionStorage.get()).toBeNull();
        });

        it('should set active sessions to true when active sessions is false', () => {
            component.activeSessions = false;
            component.updateActiveSessionSelection();
            expect(component.activeSessions).toBeTrue();
        });
    });

    describe('ngAfterViewInit', () => {
        it('should remove aria-placeholder from ng-select lists', fakeAsync(() => {
            // Arrange
            const venueList = createListElement();
            const venueContainer = createContainerElement('venue-allocation-list', venueList);

            const csoList = createListElement();
            const csoContainer = createContainerElement('cso-allocation-list', csoList);

            const lists = [venueList, csoList];
            const containers = [venueContainer, csoContainer];

            containers.forEach(container => {
                document.body.appendChild(container);
            });

            // Act
            component.ngAfterViewInit();
            tick();

            // Assert
            lists.forEach(list => {
                expect(list.hasAttribute('aria-placeholder')).toBeFalse();
            });

            // Cleanup
            containers.forEach(container => {
                document.body.removeChild(container);
            });
        }));

        describe('onVenueListDropdownOpen', () => {
            it('should set aria-label, title, and tabindex attributes on the venue listbox', fakeAsync(() => {
                // Arrange
                const listbox = document.createElement('div');
                listbox.classList.add('ng-dropdown-panel-items');
                listbox.setAttribute('role', 'listbox');
                document.body.appendChild(listbox);

                // Act
                component.onVenueListDropdownOpen();
                tick();

                // Assert
                expect(listbox.getAttribute('aria-label')).toBe('Venue selection list');
                expect(listbox.getAttribute('title')).toBe('Venue selection list');
                expect(listbox.getAttribute('tabindex')).toBe('0');

                // Cleanup
                document.body.removeChild(listbox);
            }));

            it('should set role attribute to "group" on nested divs', fakeAsync(() => {
                // Arrange
                const nestedDiv = document.createElement('div');
                nestedDiv.classList.add('ng-dropdown-panel-items');
                document.body.appendChild(nestedDiv);

                // Act
                component.onVenueListDropdownOpen();
                tick();

                // Assert
                expect(nestedDiv.getAttribute('role')).toBe('group');

                // Cleanup
                document.body.removeChild(nestedDiv);
            }));
        });

        describe('onCsoListDropdownOpen', () => {
            it('should set aria-label, title, and tabindex attributes on the Cso listbox', fakeAsync(() => {
                // Arrange
                const listbox = document.createElement('div');
                listbox.classList.add('ng-dropdown-panel-items');
                listbox.setAttribute('role', 'listbox');
                document.body.appendChild(listbox);

                // Act
                component.onCsoListDropdownOpen();
                tick();

                // Assert
                expect(listbox.getAttribute('aria-label')).toBe('Cso officer list');
                expect(listbox.getAttribute('title')).toBe('Cso officer list');
                expect(listbox.getAttribute('tabindex')).toBe('0');

                // Cleanup
                document.body.removeChild(listbox);
            }));

            it('should set role attribute to "group" on nested divs', fakeAsync(() => {
                // Arrange
                const nestedDiv = document.createElement('div');
                nestedDiv.classList.add('ng-dropdown-panel-items');
                document.body.appendChild(nestedDiv);

                // Act
                component.onCsoListDropdownOpen();
                tick();

                // Assert
                expect(nestedDiv.getAttribute('role')).toBe('group');

                // Cleanup
                document.body.removeChild(nestedDiv);
            }));
        });

        function createListElement(): HTMLInputElement {
            const input = document.createElement('input');
            input.setAttribute('aria-placeholder', 'Choose lists');
            return input;
        }

        function createContainerElement(id: string, input: HTMLInputElement): HTMLDivElement {
            const container = document.createElement('div');
            container.id = id;
            container.appendChild(input);
            return container;
        }
    });
});
