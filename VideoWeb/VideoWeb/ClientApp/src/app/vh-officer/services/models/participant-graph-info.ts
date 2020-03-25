export class ParticipantGraphInfo {
  constructor(name: string, status: string, representee: string) {
    this.name = name;
    this.status = this.getStatusAsText(status);
    this.representee = representee;
  }

  name: string;
  status: string;
  representee: string;

  getStatusAsText(status): string {
    switch (status) {
      case 'None':
      case 'NotSignedIn':
        return 'Not signed in';
      case 'InConsultation':
        return 'In consultation';
      case 'InHearing':
        return 'In hearing';
      case 'UnableToJoin':
        return 'Unable to join';
      default:
        return status;
    }
  }
}
