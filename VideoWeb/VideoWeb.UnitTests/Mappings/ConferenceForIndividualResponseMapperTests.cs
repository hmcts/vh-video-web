using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using Conference = VideoApi.Contract.Responses.ConferenceForIndividualResponse;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForIndividualResponseMapperTests : BaseMockerSutTestSetup<ConferenceForIndividualResponseMapper>
    {
        [Test]
        public void Should_map_all_properties()
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

            var response = _sut.Map(conference);

            response.Id.Should().Be(conference.Id);
            response.ScheduledDateTime.Should().Be(conference.ScheduledDateTime);
            response.CaseNumber.Should().Be(conference.CaseNumber);
            response.CaseName.Should().Be(conference.CaseName);
            response.Status.Should().Be(conference.Status);
            response.ClosedDateTime.Should().Be(conference.ClosedDateTime);
        }
    }
}
