import { ConferenceStatus } from 'src/app/services/clients/api-client';

export class ListFilter {

  constructor(description: string, selected: boolean) {
    this.Description = description;
    this.Selected = selected;
  }

  Description: string;
  Selected: boolean;
}
export class StatusFilter extends ListFilter {

  constructor(description: string, status: ConferenceStatus, selected: boolean) {
    super(description, selected);
    this.Status = status;
  }

  Status: ConferenceStatus;
}

export class HearingsFilter {

  constructor() {
    const hearingsStatuses = Object.values(ConferenceStatus);
    this.addStatuses(hearingsStatuses);
  }

  private statuses: StatusFilter[] =[];
  private locations: ListFilter[] = [];
  private alerts: ListFilter[] = [];

  get filterStatuses() {
    return this.statuses;
  }

  get filterLocations() {
    return this.locations;
  }

  get filterAlerts() {
    return this.alerts;
  }

  private addStatuses(hearingsStatuses: ConferenceStatus[]) {
    hearingsStatuses.forEach(conferenceStatus => {
      const description = this.setHearingsStatuses(conferenceStatus);
      const itemStatus = new StatusFilter(description, conferenceStatus, false);
      this.statuses.push(itemStatus);
    });
  }

  addLocations(locations: string[]) {
    locations.forEach(location => {
      const itemLocation = new ListFilter(location, false);
      this.locations.push(itemLocation);
    });
  }

  addAlerts(alerts: string[]) {
    alerts.forEach(alert => {
      const itemAlert = new ListFilter(alert, false);
      this.alerts.push(itemAlert);
    });
  }
 
  setHearingsStatuses(conferenceStatus:ConferenceStatus) {
    let description = '';
    switch (conferenceStatus) {
      case ConferenceStatus.Suspended:
        description = 'Suspended';
        break;
      case ConferenceStatus.NotStarted:
        description = 'Not started';
        break;
      case ConferenceStatus.InSession:
        description = 'In session';
        break;
      case ConferenceStatus.Paused:
        description = 'Paused';
        break;
      case ConferenceStatus.Closed:
        description = 'Closed';
        break;
      default:
        description = '';
    }

    return description;
  }

 
}
