import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { MockLogger } from 'src/app/testing/mocks/mock-logger';
import { ParticipantStatus, Role } from '../../services/clients/api-client';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { JudgeContextMenuComponent } from './judge-context-menu.component';
import { DebugElement, ElementRef } from '@angular/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import { HearingRole } from '../models/hearing-role-model';
import { Logger } from 'src/app/services/logging/logger-base';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockPipe } from 'ng-mocks';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';
import { LowerCasePipe } from '@angular/common';
import { By } from '@angular/platform-browser';
import { HearingRoleHelper } from 'src/app/shared/helpers/hearing-role-helper';
import { RandomPipe } from 'src/app/shared/pipes/random.pipe';
import { LinkedParticipantPanelModel } from '../models/linked-participant-panel-model';
import { createMockStore, MockStore, provideMockStore } from '@ngrx/store/testing';
import { ConferenceState } from '../store/reducers/conference.reducer';
import { mapConferenceToVHConference } from '../store/models/api-contract-to-state-model-mappers';
import { VHConference, VHParticipant } from '../store/models/vh-conference';
import { VideoCallHostActions } from '../store/actions/video-call-host.actions';

export class MockElementRef extends ElementRef {
    constructor() {
        super(null);
    }
}

describe('JudgeContextMenuComponent', () => {
    let mockConferenceStore: MockStore<ConferenceState>;
    let vhConference: VHConference;
    let participants: VHParticipant[];
    const logger = new MockLogger();

    const elementRef = new MockElementRef();
    elementRef.nativeElement = jasmine.createSpyObj('nativeElement', ['contains']);

    let component: JudgeContextMenuComponent;
    let fixture: ComponentFixture<JudgeContextMenuComponent>;

    const translateService = translateServiceSpy;

    const mapper = new ParticipantPanelModelMapper();

    let testParticipipantPanelModel: ParticipantPanelModel;
    const testParticipantId = 'id';
    const testParticipantDisplayName = 'displayName';
    const testParticipantRole = Role.None;
    const testParticipantPexipDisplayName = 'pexipDisplayName';
    const testParticipantHearingRole = 'hearingRole';
    const testParticipantRepresentee = 'representsee';
    const testParticipantStatus = ParticipantStatus.None;
    let hyphenateSpy: jasmine.Spy;
    let translateSpy: jasmine.Spy;
    let lowerCaseSpy: jasmine.Spy;
    let random: jasmine.Spy;

    beforeEach(async () => {
        const conference = new ConferenceTestData().getConferenceDetailNow();
        vhConference = mapConferenceToVHConference(conference);
        participants = vhConference.participants;
        mockConferenceStore = createMockStore({
            initialState: { currentConference: vhConference, availableRooms: [] }
        });
        hyphenateSpy = jasmine.createSpy('transform').and.callThrough();
        translateSpy = jasmine.createSpy('transform').and.callThrough();
        lowerCaseSpy = jasmine.createSpy('transform').and.callThrough();
        random = jasmine.createSpy('transform').and.callThrough();

        await TestBed.configureTestingModule({
            declarations: [
                JudgeContextMenuComponent,
                MockPipe(TranslatePipe, translateSpy),
                MockPipe(HyphenatePipe, hyphenateSpy),
                MockPipe(LowerCasePipe, lowerCaseSpy),
                MockPipe(RandomPipe, random)
            ],
            providers: [
                provideMockStore(),
                {
                    provide: Logger,
                    useValue: logger
                },
                {
                    provide: ElementRef,
                    useValue: elementRef
                },
                {
                    provide: TranslateService,
                    useValue: translateService
                }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(JudgeContextMenuComponent);
        component = fixture.componentInstance;

        mockConferenceStore = TestBed.inject(MockStore);

        testParticipipantPanelModel = new ParticipantPanelModel(
            testParticipantId,
            testParticipantDisplayName,
            testParticipantRole,
            testParticipantPexipDisplayName,
            testParticipantHearingRole,
            testParticipantRepresentee,
            testParticipantStatus
        );
        component.participantInput = testParticipipantPanelModel;
        component.participant = testParticipipantPanelModel;

        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        mockConferenceStore.resetSelectors();
    });

    describe('isJudge', () => {
        it('should return true when hearing role is judge', () => {
            component.participant.hearingRole = HearingRole.JUDGE;
            expect(component.isJudge).toBeTruthy();
        });

        it('should return false when hearing role is not judge', () => {
            component.participant.hearingRole = HearingRole.APPELLANT;
            expect(component.isJudge).toBeFalsy();
        });
    });

    describe('isWitness', () => {
        it('should return true when hearing role is witness', () => {
            component.participant.hearingRole = HearingRole.WITNESS;
            expect(component.isWitness).toBeTruthy();
        });

        it('should return true when hearing role is witness', () => {
            component.participant.hearingRole = HearingRole.EXPERT;
            expect(component.isWitness).toBeTruthy();
        });

        it('should return false when hearing role is not witness', () => {
            component.participant.hearingRole = HearingRole.APPELLANT;
            expect(component.isWitness).toBeFalsy();
        });
    });

    describe('isPanelMember', () => {
        it('should return true when hearing role is panel member', () => {
            component.participant.hearingRole = HearingRole.PANEL_MEMBER;
            expect(component.isPanelMember).toBeTruthy();
        });

        it('should return false when hearing role is not panel member', () => {
            component.participant.hearingRole = HearingRole.APPELLANT;
            expect(component.isPanelMember).toBeFalsy();
        });
    });

    describe('isClickedOutsideOfOpenMenu', () => {
        let event: MouseEvent;
        let containsSpy: jasmine.Spy;
        beforeEach(() => {
            event = new MouseEvent('click');
            spyOnProperty(event, 'target').and.returnValue(document.createElement('div'));
            containsSpy = spyOn(component['elementRef'].nativeElement, 'contains');
        });
        it('should return isClickedOutsideOfOpenMenu true when click event is outside element and menu is open', () => {
            // Arrange
            component.isDroppedDown = true;
            containsSpy.and.returnValue(false);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeTruthy();
        });

        it('should return isClickedOutsideOfOpenMenu false when click event is outside element and menu is closed', () => {
            // Arrange
            component.isDroppedDown = false;
            containsSpy.and.returnValue(false);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeFalsy();
        });

        it('should return isClickedOutsideOfOpenMenu false when click event is inside element and menu is open', () => {
            // Arrange
            component.isDroppedDown = true;
            containsSpy.and.returnValue(true);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeFalsy();
        });

        it('should return isClickedOutsideOfOpenMenu false when click event is inside element and menu is closed', () => {
            // Arrange
            component.isDroppedDown = false;
            containsSpy.and.returnValue(false);

            // Act
            const result = component.isClickedOutsideOfOpenMenu(event);

            // Assert
            expect(result).toBeFalsy();
        });
    });

    describe('clickout', () => {
        it('should close context menu if click is outside of the menu', () => {
            // Arrange
            spyOn(component, 'isClickedOutsideOfOpenMenu').and.returnValue(true);
            component.isDroppedDown = true;
            const event = new MouseEvent('click', {
                clientX: 15,
                clientY: 15
            });

            // Act
            component.clickout(event);

            // Assert
            expect(component.isDroppedDown).toBeFalsy();
        });

        it('should not close context menu if click is inside of the menu', () => {
            // Arrange
            spyOn(component, 'isClickedOutsideOfOpenMenu').and.returnValue(false);
            component.isDroppedDown = true;
            const event = new MouseEvent('click', {
                clientX: 15,
                clientY: 15
            });

            // Act
            component.clickout(event);

            // Assert
            expect(component.isDroppedDown).toBeTruthy();
        });
    });

    describe('lowerParticipantHand', () => {
        it('should dispatch lowerParticipantHand action and close context menu', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');

            // Act
            component.lowerParticipantHand();

            // Assert
            const expectedAction = VideoCallHostActions.lowerParticipantHand({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });
    });

    describe('toggleSpotlightParticipant', () => {
        it('should dispatch spotlightParticipant action and close context menu when participant is not spotlighted', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            spyOn(component.participant, 'hasSpotlight').and.returnValue(false);

            // Act
            component.toggleSpotlightParticipant();

            // Assert
            const expectedAction = VideoCallHostActions.spotlightParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });

        it('should dispatch removeSpotlightForParticipant action and close context menu when participant is spotlighted', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            spyOn(component.participant, 'hasSpotlight').and.returnValue(true);

            // Act
            component.toggleSpotlightParticipant();

            // Assert
            const expectedAction = VideoCallHostActions.removeSpotlightForParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });
    });

    describe('toggleMuteParticipant', () => {
        it('should dispatch lockRemoteMuteForParticipant action and close context menu when participant is not remote muted', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            spyOn(component.participant, 'isMicRemoteMuted').and.returnValue(false);

            // Act
            component.toggleMuteParticipant();

            // Assert
            const expectedAction = VideoCallHostActions.lockRemoteMuteForParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });

        it('should dispatch unlockRemoteMuteForParticipant action and close context menu when participant is remote muted', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            spyOn(component.participant, 'isMicRemoteMuted').and.returnValue(true);

            // Act
            component.toggleMuteParticipant();

            // Assert
            const expectedAction = VideoCallHostActions.unlockRemoteMuteForParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });
    });

    describe('toggleLocalMuteParticipant', () => {
        it('should dispatch localUnmuteParticipant action and close context menu when participant is locally muted', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            spyOn(component.participant, 'isLocalMicMuted').and.returnValue(true);

            // Act
            component.toggleLocalMuteParticipant();

            // Assert
            const expectedAction = VideoCallHostActions.localUnmuteParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });

        it('should dispatch localMuteParticipant action and close context menu when participant is not locally muted', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');
            spyOn(component.participant, 'isLocalMicMuted').and.returnValue(false);

            // Act
            component.toggleLocalMuteParticipant();

            // Assert
            const expectedAction = VideoCallHostActions.localMuteParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });
    });

    describe('callParticipantIntoHearing', () => {
        it('should dispatch admitParticipant action and close context menu', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');

            // Act
            component.callParticipantIntoHearing();

            // Assert
            const expectedAction = VideoCallHostActions.admitParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });
    });

    describe('dismissParticipantFromHearing', () => {
        it('should dispatch dismissParticipant action and close context menu', () => {
            // Arrange
            spyOn(mockConferenceStore, 'dispatch');

            // Act
            component.dismissParticipantFromHearing();

            // Assert
            const expectedAction = VideoCallHostActions.dismissParticipant({ participantId: component.participant.id });
            expect(mockConferenceStore.dispatch).toHaveBeenCalledWith(expectedAction);
        });
    });

    describe('toggleDropdown', () => {
        it('should toggle isDroppedDown', () => {
            // Arrange
            component.isDroppedDown = false;

            // Act
            component.toggleDropdown();

            // Assert
            expect(component.isDroppedDown).toBeTruthy();
        });
    });

    describe('showHearingRole', () => {
        it('should return false when participant is judge', () => {
            component.participant.hearingRole = HearingRole.JUDGE;
            expect(component.showHearingRole()).toBeFalsy();
        });

        it('should return false when participant is panel member', () => {
            component.participant.hearingRole = HearingRole.PANEL_MEMBER;
            expect(component.showHearingRole()).toBeFalsy();
        });

        it('should return true when participant is not judge or panel member', () => {
            component.participant.hearingRole = HearingRole.APPELLANT;
            expect(component.showHearingRole()).toBeTruthy();
        });
    });

    describe('getMuteAndLockStatusText', () => {
        it('should return unmute remote translation when participant is remote muted', () => {
            component.participant.isMicRemoteMuted = () => true;
            component.getMuteAndLockStatusText();
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.unmute-lock');
        });

        it('should return mute remote translation when participant is remote unmuted', () => {
            component.participant.isMicRemoteMuted = () => false;
            component.getMuteAndLockStatusText();
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.mute-lock');
        });
    });

    describe('getLocalMuteAStatusText', () => {
        it('should return unmute local translation when participant is muted', () => {
            component.participant.isLocalMicMuted = () => true;
            component.getLocalMuteAStatusText(component.participant);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.unmute');
        });

        it('should return mute local translation when participant is unmuted', () => {
            component.participant.isLocalMicMuted = () => false;
            component.getLocalMuteAStatusText(component.participant);
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.mute');
        });

        it('linked participant should include the display name in the text', () => {
            // arrange
            const linkedParticipants = new ConferenceTestData().getListOfLinkedParticipants();
            const pats = linkedParticipants.map(p => mapper.mapFromParticipantUserResponse(p));
            const roomLabel = 'Interpreter1';
            const roomId = '787';
            const model = LinkedParticipantPanelModel.fromListOfPanelModels(pats, roomLabel, roomId);
            component.participant = model;
            const participant = model.participants[0];

            // act
            const text = component.getLocalMuteAStatusText(component.participant);

            // assert
            expect(text).toContain(participant.displayName);
        });
    });

    describe('getPinStatusText', () => {
        it('should return pin translation when participant is not pinned', () => {
            // update to not be spotlighted
            component.participant.updateParticipant(null, null, false);
            component.getPinStatusText();
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.pin');
        });

        it('should return unpin translation when participant is pinned', () => {
            // update to be spotlighted
            component.participant.updateParticipant(null, null, true);
            component.getPinStatusText();
            expect(translateServiceSpy.instant).toHaveBeenCalledWith('judge-context-menu.unpin');
        });
    });

    describe('canCallParticipantIntoHearing', () => {
        it('should return true when participant not in a hearing', () => {
            component.participant.updateStatus(ParticipantStatus.Available);
            expect(component.canCallParticipantIntoHearing()).toBeTruthy();
        });

        it('should return false when participant is in a hearing', () => {
            component.participant.updateStatus(ParticipantStatus.InHearing);
            expect(component.canCallParticipantIntoHearing()).toBeFalsy();
        });
    });

    describe('canDismissParticipantFromHearing', () => {
        it('should return false when participant not in a hearing', () => {
            component.participant.updateStatus(ParticipantStatus.Available);
            expect(component.canDismissParticipantFromHearing()).toBeFalsy();
        });

        it('should return true when participant is in a hearing', () => {
            component.participant.updateStatus(ParticipantStatus.InHearing);
            expect(component.canDismissParticipantFromHearing()).toBeTruthy();
        });
    });

    describe('UI tests', () => {
        let dropdownElement;
        function fakeGetElementId(section: string) {
            return `${component.idPrefix}-${section}-undefined`;
        }
        describe('dropdown', () => {
            beforeEach(() => {
                const dropdownId = fakeGetElementId('dropdown');
                dropdownElement = fixture.debugElement.query(By.css(`#${dropdownId}`));
            });
            it('dropdown should be hidden', () => {
                component.isDroppedDown = false;
                fixture.detectChanges();
                expect(dropdownElement.nativeElement.hasAttribute('hidden')).toBe(true);
            });

            describe('when visible', () => {
                describe('header', () => {
                    beforeEach(() => {
                        component.isDroppedDown = true;
                        fixture.detectChanges();
                    });
                    it('dropdown should not be hidden', () => {
                        expect(dropdownElement.nativeElement.hasAttribute('hidden')).toBe(false);
                    });

                    it('displayName should be correct', () => {
                        const displayNameId = fakeGetElementId('display-name');
                        const displayNameStrongElement = fixture.debugElement.query(By.css(`#${displayNameId} > strong`));

                        expect(displayNameStrongElement.nativeElement.textContent.trim()).toEqual(testParticipantDisplayName);
                    });
                    describe('hearing role', () => {
                        let hearingRoleFullElement;
                        let hearingRoleFullElementId;
                        beforeEach(() => {
                            hearingRoleFullElementId = fakeGetElementId('hearing-role-full');
                        });
                        it('should not show for judge', () => {
                            component.participant.hearingRole = HearingRole.JUDGE;
                            fixture.detectChanges();
                            hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
                            expect(hearingRoleFullElement).toBeFalsy();
                        });
                        const panelMemberHearingRoles = HearingRoleHelper.panelMemberRoles;
                        panelMemberHearingRoles.forEach(hearingRole => {
                            it(`should not show for panel member - ${hearingRole}`, () => {
                                component.participant.hearingRole = hearingRole;
                                fixture.detectChanges();
                                hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
                                expect(hearingRoleFullElement).toBeFalsy();
                            });
                        });

                        describe('when not judge or panel member', () => {
                            beforeEach(() => {
                                fixture.detectChanges();
                                hearingRoleFullElement = fixture.debugElement.query(By.css(`#${hearingRoleFullElementId}`));
                            });

                            it('should have correct hearing role', () => {
                                const testHearingRole = 'Test hearing role';
                                const testHearingRoleHyphenated = 'test-hearing-role-hyphenated';
                                const testHearingRoleHyphenatedWithPrefix = `hearing-role.${testHearingRoleHyphenated}`;
                                const testHearingRoleTranslated = 'Test hearing role translated';
                                hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);

                                component.participant.hearingRole = testHearingRole;
                                fixture.detectChanges();

                                const hearingRoleElementId = fakeGetElementId('hearing-role');
                                const hearingRoleElement = fixture.debugElement.query(By.css(`#${hearingRoleElementId}`));

                                expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                expect(hearingRoleElement.nativeElement.textContent.trim()).toEqual(testHearingRoleTranslated);
                            });

                            describe('representee', () => {
                                let representeeElementId: string;
                                beforeEach(() => {
                                    representeeElementId = fakeGetElementId('representee');
                                });

                                it('should not display', () => {
                                    component.participant.representee = null;
                                    fixture.detectChanges();
                                    const representeeElement = fixture.debugElement.query(By.css(`#${representeeElementId}`));
                                    expect(representeeElement).toBeFalsy();
                                });

                                it('should have correct details for representee', () => {
                                    const representeeString = 'Test representee';
                                    component.participant.representee = representeeString;
                                    fixture.detectChanges();

                                    const representeeElement = fixture.debugElement.query(By.css(`#${representeeElementId}`));
                                    expect(representeeElement).toBeTruthy();
                                    expect(representeeElement.nativeElement.textContent.trim()).toEqual(representeeString);
                                });
                            });
                        });
                    });
                });

                describe('controls', () => {
                    const testHearingRole = 'Test hearing role';
                    const testHearingRoleHyphenated = 'test-hearing-role-hyphenated';
                    const testHearingRoleHyphenatedWithPrefix = `hearing-role.${testHearingRoleHyphenated}`;
                    const testHearingRoleTranslated = 'Test hearing role translated';
                    const testHearingRoleTranslatedLowercase = 'test hearing role translated lower case';

                    describe('call', () => {
                        let callId;
                        let canCallParticipantIntoHearingSpy: jasmine.Spy;
                        let callElement: DebugElement;
                        beforeEach(() => {
                            callId = fakeGetElementId('call');
                            canCallParticipantIntoHearingSpy = spyOn(component, 'canCallParticipantIntoHearing');
                        });

                        it('should not display', () => {
                            canCallParticipantIntoHearingSpy.and.returnValue(false);
                            fixture.detectChanges();
                            callElement = fixture.debugElement.query(By.css(`#${callId}`));
                            expect(callElement).toBeFalsy();
                        });

                        describe('when canCallParticipantIntoHearing is true', () => {
                            beforeEach(() => {
                                canCallParticipantIntoHearingSpy.and.returnValue(true);
                                fixture.detectChanges();
                                callElement = fixture.debugElement.query(By.css(`#${callId}`));
                            });

                            it('should display', () => {
                                expect(callElement).toBeTruthy();
                            });

                            it('should display correct value when not witness', () => {
                                const admitParticipantPath = 'judge-context-menu.admit-participant';
                                const admitReturn = 'Admit return';

                                hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);
                                lowerCaseSpy.withArgs(testHearingRoleTranslated).and.returnValue(testHearingRoleTranslatedLowercase);
                                translateSpy
                                    .withArgs(admitParticipantPath, { role: testHearingRoleTranslatedLowercase })
                                    .and.returnValue(admitReturn);
                                spyOnProperty(component, 'isWitness').and.returnValue(false);
                                component.participant.hearingRole = testHearingRole;
                                fixture.detectChanges();

                                callElement = fixture.debugElement.query(By.css(`#${callId}`));
                                expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                expect(lowerCaseSpy).toHaveBeenCalledWith(testHearingRoleTranslated);
                                expect(translateSpy).toHaveBeenCalledWith(admitParticipantPath, {
                                    role: testHearingRoleTranslatedLowercase
                                });
                                expect(callElement.nativeElement.textContent.trim()).toEqual(admitReturn);
                            });

                            it('should display correct value when witness', () => {
                                const callWitnessPath = 'judge-context-menu.call-witness';
                                const witnessReturn = 'Witness return';
                                translateSpy.withArgs(callWitnessPath).and.returnValue(witnessReturn);
                                spyOnProperty(component, 'isWitness').and.returnValue(true);
                                fixture.detectChanges();

                                callElement = fixture.debugElement.query(By.css(`#${callId}`));
                                expect(translateSpy).toHaveBeenCalledWith(callWitnessPath);
                                expect(callElement.nativeElement.textContent.trim()).toEqual(witnessReturn);
                            });
                        });
                    });

                    describe('dismiss', () => {
                        let dismissId;
                        let canDismissParticipantFromHearingSpy: jasmine.Spy;
                        let dismissElement: DebugElement;

                        beforeEach(() => {
                            dismissId = fakeGetElementId('dismiss');
                            canDismissParticipantFromHearingSpy = spyOn(component, 'canDismissParticipantFromHearing');
                        });

                        it('should not display', () => {
                            canDismissParticipantFromHearingSpy.and.returnValue(false);
                            fixture.detectChanges();
                            dismissElement = fixture.debugElement.query(By.css(`#${dismissId}`));
                            expect(dismissElement).toBeFalsy();
                        });

                        describe('when canDismissParticipantFromHearing is true', () => {
                            beforeEach(() => {
                                canDismissParticipantFromHearingSpy.and.returnValue(true);
                                fixture.detectChanges();
                                dismissElement = fixture.debugElement.query(By.css(`#${dismissId}`));
                            });

                            it('should display', () => {
                                expect(dismissElement).toBeTruthy();
                            });

                            it('should display correct value when not witness', () => {
                                const dismissParticipantPath = 'judge-context-menu.dismiss-participant';
                                const dismissReturn = 'Dismiss return';

                                hyphenateSpy.withArgs(testHearingRole).and.returnValue(testHearingRoleHyphenated);
                                translateSpy.withArgs(testHearingRoleHyphenatedWithPrefix).and.returnValue(testHearingRoleTranslated);
                                lowerCaseSpy.withArgs(testHearingRoleTranslated).and.returnValue(testHearingRoleTranslatedLowercase);
                                translateSpy
                                    .withArgs(dismissParticipantPath, { role: testHearingRoleTranslatedLowercase })
                                    .and.returnValue(dismissReturn);
                                component.participant.hearingRole = testHearingRole;
                                fixture.detectChanges();

                                dismissElement = fixture.debugElement.query(By.css(`#${dismissId}`));

                                expect(hyphenateSpy).toHaveBeenCalledWith(testHearingRole);
                                expect(translateSpy).toHaveBeenCalledWith(testHearingRoleHyphenatedWithPrefix);
                                expect(lowerCaseSpy).toHaveBeenCalledWith(testHearingRoleTranslated);
                                expect(translateSpy).toHaveBeenCalledWith(dismissParticipantPath, {
                                    role: testHearingRoleTranslatedLowercase
                                });
                                expect(dismissElement.nativeElement.textContent.trim()).toEqual(dismissReturn);
                            });
                        });
                    });
                });
            });
        });
    });

    describe('idPrefix', () => {
        let expectedValue: string;

        const prefix = 'judge-context-menu';

        it('should return correct value when section is null and participant id is present', () => {
            component.participant.id = testParticipantId;
            fixture.detectChanges();
            expectedValue = `${prefix}-participant-${testParticipantId}`;
        });

        it('should return correct value when section and participant id is null', () => {
            component.participant.id = null;
            expectedValue = `${prefix}`;
        });

        it('should return correct value when section and participant is null', () => {
            component.participant = null;
            expectedValue = `${prefix}`;
        });

        afterEach(() => {
            component.ngOnInit();
            expect(component.idPrefix).toEqual(expectedValue);
        });
    });
});
