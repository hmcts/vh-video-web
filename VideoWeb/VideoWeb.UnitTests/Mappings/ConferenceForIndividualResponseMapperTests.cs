using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using Conference = VideoWeb.Services.Video.ConferenceForIndividualResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForIndividualResponseMapperTests
    {
        [Test]
        public void should_map_all_properties()
        {
            const string loggedInUsername = "test@user.com";

            var participants = new List<ParticipantSummaryResponse>
            {
                new ParticipantSummaryResponseBuilder(UserRole.Individual)
                    .WithStatus(ParticipantState.Available).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Representative)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Judge)
                    .WithStatus(ParticipantState.NotSignedIn).Build()
            };
            participants[0].Username = loggedInUsername;

            var conference = Builder<Conference>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .Build();

            var response = ConferenceForIndividualResponseMapper.MapConferenceSummaryToModel(conference);

            response.Id.Should().Be(conference.Id);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseName.Should().Be(conference.Case_name);
            response.State.Should().Be(conference.State);
            response.ClosedDateTime.Should().Be(conference.Closed_date_time);
        }
    }
}
