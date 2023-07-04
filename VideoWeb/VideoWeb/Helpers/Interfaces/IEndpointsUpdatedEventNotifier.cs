using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;

namespace VideoWeb.Helpers.Interfaces
{
    public interface IEndpointsUpdatedEventNotifier
    {
        public Task PushEndpointsUpdatedEvent(Conference conference, UpdateConferenceEndpointsRequest endpointsToNotify);
        public Task PushUnlinkedParticipantFromEndpoint(Guid conferenceId, string participant, string jvsEndpointName);
        public Task PushLinkedNewParticipantToEndpoint(Guid conferenceId, string participant, string jvsEndpointName);
        public Task PushCloseConsultationBetweenEndpointAndParticipant(Guid conferenceId, string participant, string jvsEndpointName);
    }
}
