using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
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

            var response = _mapper.MapConferenceSummaryToResponseModel(conference);

            response.Id.Should().Be(conference.Id.GetValueOrDefault());
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time.GetValueOrDefault());
        }

        [Test]
        public void should_map_all_participants()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(2).Build().ToList();

            var response = _mapper.MapParticipants(participants);

            for (var index = 0; index < participants.Count; index++)
            {
                var participant = participants[index];
                response[index].Username.Should().Be(participant.Username);
                response[index].Status.ToString().Should().Be(participant.Status.ToString());
            }

        }
    }
}