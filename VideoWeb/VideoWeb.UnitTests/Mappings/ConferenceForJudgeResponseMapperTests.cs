using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForJudgeResponseMapperTests
    {
        [Test]
        public void should_map_all_properties()
        {
            var participants = new List<ParticipantSummaryResponse>
            {
                new ParticipantSummaryResponseBuilder(UserRole.Individual)
                    .WithStatus(ParticipantState.Available).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Representative)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Judge)
                    .WithStatus(ParticipantState.NotSignedIn).Build()
            };

            var conference = Builder<ConferenceSummaryResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Hearing_ref_id = Guid.NewGuid())
                .With(x => x.Participants = participants)
                .Build();

            var response = ConferenceForJudgeResponseMapper.MapConferenceSummaryToModel(conference);

            response.Id.Should().Be(conference.Id);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.CaseType.Should().Be(conference.Case_type);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseName.Should().Be(conference.Case_name);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.Participants.Count.Should().Be(participants.Count);
        }
    }
}
