import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import {
    ParticipantForUserResponse,
    ParticipantResponse,
    ParticipantStatus,
    Role,
    VideoEndpointResponse
} from 'src/app/services/clients/api-client';
import { EventsService } from 'src/app/services/events.service';
import { Logger } from 'src/app/services/logging/logger-base';
import { EndpointStatusMessage } from 'src/app/services/models/EndpointStatusMessage';
import { ParticipantStatusMessage } from 'src/app/services/models/participant-status-message';
import { PanelModel, ParticipantPanelModel, VideoEndpointPanelModel } from '../models/participant-panel-model';
import { ConferenceUpdated, ParticipantUpdated } from '../models/video-call-models';
import { VideoCallService } from '../services/video-call.service';

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit, AfterViewInit, OnDestroy {
    participants: PanelModel[] = [];
    isMuteAll = false;
    conferenceId: string;

    videoCallSubscription$ = new Subscription();
    eventhubSubscription$ = new Subscription();

    firstElement: HTMLElement;
    lastElement: HTMLElement;

    isScrolling = 0;

    constructor(
        private videoWebService: VideoWebService,
        private route: ActivatedRoute,
        private videoCallService: VideoCallService,
        private eventService: EventsService,
        private logger: Logger
    ) {}

    get muteAllToggleText() {
        if (this.isMuteAll) {
            return 'Unmute all';
        } else {
            return 'Mute all';
        }
    }

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList().then(() => {
            this.setupVideoCallSubscribers();
            this.setupEventhubSubscribers();
        });
    }

    ngAfterViewInit() {
        setTimeout(() => this.initializeScrolling(), 1000);
    }

    initializeScrolling() {
        this.firstElement = document.querySelector('#panel_participant_0');
        this.lastElement = document.querySelector('#panel_participant_' + (this.participants.length - 1));
        this.setScrollingIndicator();
    }

    ngOnDestroy(): void {
        this.videoCallSubscription$.unsubscribe();
        this.eventhubSubscription$.unsubscribe();
    }

    setupVideoCallSubscribers() {
        this.videoCallSubscription$.add(
            this.videoCallService
                .onParticipantUpdated()
                .subscribe(updatedParticipant => this.handleParticipantUpdatedInVideoCall(updatedParticipant))
        );

        this.videoCallSubscription$.add(
            this.videoCallService
                .onConferenceUpdated()
                .subscribe(updatedConference => this.handleUpdatedConferenceVideoCall(updatedConference))
        );
    }

    setupEventhubSubscribers() {
        this.eventhubSubscription$.add(
            this.eventService.getParticipantStatusMessage().subscribe(message => {
                this.handleParticipantStatusChange(message);
            })
        );

        this.eventhubSubscription$.add(
            this.eventService.getEndpointStatusMessage().subscribe(message => {
                this.handleEndpointStatusChange(message);
            })
        );
    }

    handleUpdatedConferenceVideoCall(updatedConference: ConferenceUpdated): void {
        this.isMuteAll = updatedConference.guestedMuted;
    }

    handleParticipantUpdatedInVideoCall(updatedParticipant: ParticipantUpdated): boolean {
        console.log('--------- participant update in video call ---------');
        console.log(updatedParticipant);
        const participant = this.participants.find(x => x.pexipDisplayName === updatedParticipant.pexipDisplayName);
        if (!participant) {
            console.log('unable to find participant');
            console.log(updatedParticipant);
            return;
        }
        participant.pexipId = updatedParticipant.uuid;
        participant.isMuted = updatedParticipant.isRemoteMuted;
        participant.handRaised = updatedParticipant.handRaised;
    }

    handleParticipantStatusChange(message: ParticipantStatusMessage): void {
        const participant = this.participants.find(x => x.id === message.participantId);
        if (!participant) {
            return;
        }
        (<ParticipantPanelModel>participant).status = message.status;
    }

    handleEndpointStatusChange(message: EndpointStatusMessage) {
        const endpoint = this.participants.find(x => x.id === message.endpointId);
        if (!endpoint) {
            return;
        }
        (<VideoEndpointPanelModel>endpoint).status = message.status;
    }

    async getParticipantsList() {
        try {
            const pats = this.videoWebService.getParticipantsByConferenceId(this.conferenceId);
            const eps = this.videoWebService.getEndpointsForConference(this.conferenceId);

            (await pats)
                .filter(x => x.role !== Role.Judge)
                .forEach(x => {
                    const participant = new ParticipantPanelModel(x);
                    this.participants.push(participant);
                });

            (await eps).forEach(x => {
                const endpoint = new VideoEndpointPanelModel(x);
                this.participants.push(endpoint);
            });

            this.participants.sort((x, z) => {
                return x.orderInTheList === z.orderInTheList ? 0 : +(x.orderInTheList > z.orderInTheList) || -1;
            });
        } catch (err) {
            this.logger.error('Failed to get participants for judge hearing panel', err);
        }
    }

    isParticipantInHearing(participant: PanelModel): boolean {
        return participant.isInHearing();
    }

    toggleMuteAll() {
        this.videoCallService.muteAllParticipants(!this.isMuteAll);
    }

    toggleMuteParticipant(participant: PanelModel) {
        const hearingParticipants = this.participants.filter(x => x.isInHearing());
        const mutedParticipants = hearingParticipants.filter(x => x.isMuted);
        const p = this.participants.find(x => x.id === participant.id);

        this.videoCallService.muteParticipant(p.pexipId, !p.isMuted);

        // check if last person to be unmuted manually
        if (mutedParticipants.length === 1 && this.isMuteAll) {
            this.videoCallService.muteAllParticipants(false);
        }

        // mute conference if last person manually muted
        if (mutedParticipants.length === hearingParticipants.length - 1) {
            this.videoCallService.muteAllParticipants(true);
        }
    }

    lowerAllHands() {
        this.videoCallService.lowerAllHands();
    }

    lowerParticipantHand(participantId: string) {
        const participant = this.participants.find(x => x.id === participantId);
        this.videoCallService.lowerHandById(participant.pexipId);
    }

    onScroll() {
        this.setScrollingIndicator();
    }

    scrollUp() {
        this.firstElement.scrollIntoView();
    }

    scrollDown() {
        this.lastElement.scrollIntoView();
    }

    isItemOfListVisible(element: HTMLElement) {
        if (element) {
            const position = element.getBoundingClientRect();

            // return true if element is fully visiable in screen
            return position.top >= 0 && position.bottom <= window.innerHeight;
        }

        return false;
    }

    setScrollingIndicator() {
        if (this.isItemOfListVisible(this.lastElement) && this.isItemOfListVisible(this.firstElement)) {
            this.isScrolling = 0; // no scrolling
        } else if (this.isItemOfListVisible(this.firstElement)) {
            this.isScrolling = 1; // scrolling to bottom
        } else {
            this.isScrolling = 2; // scrolling to top
        }
    }

    isEndpoint(participant: PanelModel) {
        return participant instanceof VideoEndpointPanelModel;
    }

    mapParticipantToParticipantResponse(participant: ParticipantPanelModel): ParticipantResponse {
        const participantResponse = new ParticipantResponse();
        participantResponse.id = participant.id;
        participantResponse.status = participant.status;
        participantResponse.display_name = participant.displayName;
        participantResponse.role = participant.role;
        participantResponse.case_type_group = participant.caseTypeGroup;
        return participantResponse;
    }

    isParticipantDisconnected(participant: ParticipantPanelModel): boolean {
        return participant.status === ParticipantStatus.Disconnected;
    }
}
