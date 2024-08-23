using System;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.EventHub.Services
{
    public interface IConferenceVideoControlStatusService
    {
        Task<ConferenceVideoControlStatuses?> GetVideoControlStateForConference(Guid conferenceId, CancellationToken cancellationToken = default);
        Task SetVideoControlStateForConference(Guid conferenceId, ConferenceVideoControlStatuses? conferenceVideoControlStatuses, CancellationToken cancellationToken = default);

        Task UpdateMediaStatusForParticipantInConference(Guid conferenceId, string participantId, ParticipantMediaStatus mediaStatus, CancellationToken cancellationToken = default);
    }
}
