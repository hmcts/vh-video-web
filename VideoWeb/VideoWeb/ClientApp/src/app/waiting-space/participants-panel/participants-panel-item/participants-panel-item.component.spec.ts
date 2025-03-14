import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantsPanelItemComponent } from './participants-panel-item.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { translateServiceSpy } from 'src/app/testing/mocks/mock-translation.service';
import { MockComponent, MockDirective, MockPipe } from 'ng-mocks';
import { MultilinePipe } from 'src/app/shared/pipes/multiline.pipe';
import { HearingRole } from '../../models/hearing-role-model';
import { ConferenceTestData } from 'src/app/testing/mocks/data/conference-test-data';
import { ConferenceResponse, EndpointStatus, Role } from 'src/app/services/clients/api-client';
import { ParticipantPanelModelMapper } from 'src/app/shared/mappers/participant-panel-model-mapper';
import { TooltipDirective } from 'src/app/shared/directives/tooltip.directive';
import { CrestLogoImageSourceDirective } from 'src/app/shared/directives/crest-logo-image-source.directive';
import { JudgeContextMenuComponent } from '../../judge-context-menu/judge-context-menu.component';
import { VideoEndpointPanelModel } from '../../models/video-endpoint-panel-model';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { HyphenatePipe } from 'src/app/shared/pipes/hyphenate.pipe';

describe('ParticipantsPanelItemComponent', () => {
    let component: ParticipantsPanelItemComponent;
    let fixture: ComponentFixture<ParticipantsPanelItemComponent>;
    let conference: ConferenceResponse;
    const testData: ConferenceTestData = new ConferenceTestData();
    const panelModelMapper = new ParticipantPanelModelMapper();
    beforeEach(async () => {
        conference = testData.getConferenceDetailNow();

        await TestBed.configureTestingModule({
            declarations: [
                ParticipantsPanelItemComponent,
                MockPipe(TranslatePipe),
                MockPipe(MultilinePipe),
                MockPipe(HyphenatePipe),
                MockComponent(FaIconComponent),
                MockDirective(TooltipDirective),
                MockDirective(CrestLogoImageSourceDirective),
                MockComponent(JudgeContextMenuComponent)
            ],
            providers: [{ provide: TranslateService, useValue: translateServiceSpy }]
        }).compileComponents();

        fixture = TestBed.createComponent(ParticipantsPanelItemComponent);
        component = fixture.componentInstance;
    });

    describe('mapParticipantToParticipantResponse', () => {
        it('should map panel member to response', () => {
            const participant = conference.participants[0];
            const item = panelModelMapper.mapFromParticipantUserResponse(participant);
            component.item = item;

            fixture.detectChanges();

            const result = component.mapParticipantToParticipantResponse();
            expect(result.id).toBe(participant.id);
            expect(result.status).toBe(participant.status);
            expect(result.displayName).toBe(participant.display_name);
            expect(result.role).toBe(participant.role);
            expect(result.hearingRole).toBe(participant.hearing_role);
            expect(result.representee).toBe(participant.representee);
        });
    });

    describe('Participant Is Judge', () => {
        beforeEach(() => {
            const judge = conference.participants.find(x => x.hearing_role === HearingRole.JUDGE);
            const item = panelModelMapper.mapFromParticipantUserResponse(judge);
            component.item = item;

            fixture.detectChanges();
        });

        it('should set isJudge to true', () => {
            expect(component.isJudge).toBeTruthy();
            expect(component.isHost).toBeTruthy();
            expect(component.isEndpoint).toBeFalsy();
        });
    });

    describe('Participant is a JoH', () => {
        beforeEach(() => {
            const joh = testData.getFullListOfPanelMembers()[0];
            const item = panelModelMapper.mapFromParticipantUserResponse(joh);
            component.item = item;

            fixture.detectChanges();
        });

        it('should set isHost to true', () => {
            expect(component.isJudicialOfficeHolder).toBeTruthy();
        });
    });

    describe('Participant is an endpoint', () => {
        beforeEach(() => {
            const endpoint = conference.endpoints[0];
            endpoint.status = EndpointStatus.Disconnected;
            const item = new VideoEndpointPanelModel(endpoint);
            component.item = item;

            fixture.detectChanges();
        });

        it('should set isEndpoint to true', () => {
            expect(component.isEndpoint).toBeTruthy();
        });
    });

    describe('Participant is a witness', () => {
        beforeEach(() => {
            const witness = testData.getListOfParticipantsWitness()[0];
            const item = panelModelMapper.mapFromParticipantUserResponse(witness);
            component.item = item;

            fixture.detectChanges();
        });

        it('should set isWitness to true', () => {
            expect(component.isWitness).toBeTruthy();
        });
    });

    describe('Participant is a linked participant and an interpreter', () => {
        beforeEach(() => {
            const linkedParticipants = testData.getListOfLinkedParticipants();
            const item = panelModelMapper.mapFromParticipantUserResponseArray(linkedParticipants);
            component.item = item[0];

            fixture.detectChanges();
        });

        it('should return true for linked participant who is an interpreter', () => {
            expect(component.isLinkedParticipantAndAnInterpreter()).toBeTruthy();
        });
    });

    describe('Participant is a representative', () => {
        beforeEach(() => {
            const representative = conference.participants.find(x => x.role === Role.Representative);
            const item = panelModelMapper.mapFromParticipantUserResponse(representative);
            component.item = item;

            fixture.detectChanges();
        });

        it('should return representative text for case type group', () => {
            expect(component.getPanelRowTooltipText()).toContain(
                `${component.participant.displayName}: participants-panel.not-joined<br/>hearing-role.representative participants-panel.for ${component.participant.representee}`
            );
        });
    });

    describe('event emitters', () => {
        beforeEach(() => {
            const individual = conference.participants.find(x => x.role === Role.Individual);
            const item = panelModelMapper.mapFromParticipantUserResponse(individual);
            component.item = item;

            fixture.detectChanges();
        });

        it('should emit participantMuteToggled', () => {
            spyOn(component.participantMuteToggled, 'emit');

            component.toggleParticipantMute();

            expect(component.participantMuteToggled.emit).toHaveBeenCalledWith({
                participant: component.participant
            });
        });

        it('should emit participantSpotlightToggled', () => {
            spyOn(component.participantSpotlightToggled, 'emit');

            component.toggleParticipantSpotlight();

            expect(component.participantSpotlightToggled.emit).toHaveBeenCalledWith({
                participant: component.participant
            });
        });

        it('should emit participantLocalMuteToggled', () => {
            spyOn(component.participantLocalMuteToggled, 'emit');

            component.toggleParticipantLocalMute();

            expect(component.participantLocalMuteToggled.emit).toHaveBeenCalledWith({
                participant: component.participant
            });
        });

        it('should emit participantHandLowered', () => {
            spyOn(component.participantHandLowered, 'emit');

            component.lowerParticipantHand();

            expect(component.participantHandLowered.emit).toHaveBeenCalledWith({
                participant: component.participant
            });
        });

        it('should emit participantAdmitted', () => {
            spyOn(component.participantAdmitted, 'emit');

            component.callParticipantIntoHearing();

            expect(component.participantAdmitted.emit).toHaveBeenCalledWith({
                participant: component.participant
            });
        });

        it('should emit participantDismissed', () => {
            spyOn(component.participantDismissed, 'emit');

            component.dismissParticipantFromHearing();

            expect(component.participantDismissed.emit).toHaveBeenCalledWith({
                participant: component.participant
            });
        });
    });
});
