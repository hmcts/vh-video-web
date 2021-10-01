using System;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using Conference = VideoApi.Contract.Responses.ConferenceForHostResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;
using Participant = VideoApi.Contract.Responses.ParticipantForHostResponse;

namespace VideoWeb.Mappings
{
    public class ConferenceForHostResponseMapper : IMapTo<Conference, ConferenceForHostResponse>
    {
        private readonly IMapTo<Participant, ParticipantForHostResponse> _participantForHostResponseMapper;

        public ConferenceForHostResponseMapper(IMapTo<Participant, ParticipantForHostResponse> participantForHostResponseMapper)
        {
            _participantForHostResponseMapper = participantForHostResponseMapper;
        }

        public ConferenceForHostResponse Map(Conference conference)
        {
            return new ConferenceForHostResponse
            {
                Id = conference.Id,
                Status = Enum.Parse<ConferenceStatus>(conference.Status.ToString()),
                CaseName = conference.CaseName,
                CaseNumber = conference.CaseNumber,
                CaseType = conference.CaseType,
                ScheduledDuration = conference.ScheduledDuration,
                ClosedDateTime = conference.ClosedDateTime,
                ScheduledDateTime = conference.ScheduledDateTime,
                Participants = conference.Participants.Select(_participantForHostResponseMapper.Map).ToList(),
                NumberOfEndpoints = conference.NumberOfEndpoints
            };
        }
    }
}
