import { Component, OnInit } from '@angular/core';
import { VideoWebService } from 'src/app/services/api/video-web.service';
import { ParticipantForUserResponse, Role } from 'src/app/services/clients/api-client';
import { ParticipantPanelModel } from '../models/participant-panel-model';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-participants-panel',
    templateUrl: './participants-panel.component.html',
    styleUrls: ['./participants-panel.component.scss']
})
export class ParticipantsPanelComponent implements OnInit {
    participants: ParticipantPanelModel[] = [];
    expandPanel = true;
    isMuteAll = false;
    isLowerAllHands = true;
    conferenceId: string;

    constructor(private videoWebService: VideoWebService, protected route: ActivatedRoute) {}

    ngOnInit() {
        this.conferenceId = this.route.snapshot.paramMap.get('conferenceId');
        this.getParticipantsList();
    }

    getParticipantsList() {
        this.videoWebService.getParticipantsByConferenceId(this.conferenceId).then(data => {
            if (data && data.length > 0) {
                data.filter(x => x.role !== Role.Judge).forEach(x => {
                    const participant = this.mapParticipant(x);
                    this.participants.push(participant);
                });
                this.participants.sort((x, z) => {
                    return x.orderInTheList === z.orderInTheList ? 0 : +(x.orderInTheList > z.orderInTheList) || -1;
                });
            }
        });
    }

    toggleCollapseExpand() {
        this.expandPanel = !this.expandPanel;
    }

    muteAll() {
        this.isMuteAll = !this.isMuteAll;
    }

    lowerAllHands() {
        this.isLowerAllHands = !this.isLowerAllHands;
    }

    private mapParticipant(participant: ParticipantForUserResponse): ParticipantPanelModel {
        return new ParticipantPanelModel(participant.id, participant.display_name, participant.role, participant.case_type_group);
    }
}
