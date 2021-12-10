using System;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Services
{
    public interface IConferenceVideoControlStatusService
    {
        Task<ConferenceVideoControlStatuses?> GetVideoControlStateForConference(Guid conferenceId);
        Task SetVideoControlStateForConference(Guid conferenceId, ConferenceVideoControlStatuses? conferenceVideoControlStatuses);

        Task UpdateMediaStatusForParticipantInConference(Guid conferenceId, string participantId, ParticipantMediaStatus mediaStatus);
    }
}
