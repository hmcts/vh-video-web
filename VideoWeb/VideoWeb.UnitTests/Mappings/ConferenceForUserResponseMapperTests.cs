using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System.Linq;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForUserResponseMapperTests
    {
        private readonly ConferenceForUserResponseMapper _mapper = new ConferenceForUserResponseMapper();

        [Test]
        public void should_map_all_properties()
        {
            var conference = Builder<ConferenceSummaryResponse>.CreateNew().Build();

            conference.Participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(10).Build().ToList();

            var response = _mapper.MapConferenceSummaryToResponseModel(conference);

            response.Id.Should().Be(conference.Id.GetValueOrDefault());
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseType.Should().Be(conference.Case_type);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time.GetValueOrDefault());
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration.GetValueOrDefault());
            response.Status.ToString().Should().Be(conference.Status.GetValueOrDefault().ToString());
            response.NoOfParticipantsAvailable.Should().Be(conference.Participants.Count(x => x.Status == ParticipantState.Available));
            response.NoOfParticipantsInConsultation.Should().Be(conference.Participants.Count(x => x.Status == ParticipantState.InConsultation));
            response.NoOfParticipantsUnavailable.Should().Be(conference.Participants.Count(x =>
                x.Status != ParticipantState.InConsultation || x.Status == ParticipantState.Available));
        }

        [Test]
        public void should_map_all_participants()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(2).Build().ToList();

            var response = _mapper.MapParticipants(participants);

            for (var index = 0; index < participants.Count; index++)
            {
                var participant = participants[index];
                response[index].Username.Should().BeEquivalentTo(participant.Username);
                response[index].Status.ToString().Should().BeEquivalentTo(participant.Status.ToString());
            }
        }

        [Test]
        public void should_map_all_participant_statuses()
        {
            var participantStatuses = Builder<ParticipantState>.CreateListOfSize(8).Build().ToList();

            foreach (var participantStatus in participantStatuses)
            {
                var response = _mapper.MapParticipantStatus(participantStatus);
                response.Should().BeOfType(typeof(ParticipantStatus));
            }
        }
    }
}