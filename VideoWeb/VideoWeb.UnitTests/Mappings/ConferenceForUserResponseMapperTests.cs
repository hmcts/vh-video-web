using System;
using System.Collections.Generic;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using ConferenceUserRole = VideoWeb.Services.Video.UserRole;
using ParticipantSummaryResponseBuilder = VideoWeb.UnitTests.Builders.ParticipantSummaryResponseBuilder;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForUserResponseMapperTests
    {
        [Test]
        public void Should_map_all_properties()
        {
            var conference = Builder<ConferenceSummaryResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Hearing_ref_id = Guid.NewGuid())
                .Build();

            var participants = new List<ParticipantSummaryResponse>
            {
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Individual)
                    .WithStatus(ParticipantState.Available).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Representative)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Individual)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Individual)
                    .WithStatus(ParticipantState.InConsultation).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Individual)
                    .WithStatus(ParticipantState.InConsultation).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Representative)
                    .WithStatus(ParticipantState.InConsultation).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Representative)
                    .WithStatus(ParticipantState.InConsultation).Build(),
                new ParticipantSummaryResponseBuilder(ConferenceUserRole.Judge)
                    .WithStatus(ParticipantState.NotSignedIn).Build()
            };

            conference.Participants = participants;
            conference.Tasks = new List<TaskResponse> { new TaskResponse { Id = 1, Status = TaskStatus.ToDo, Body = "self-test" } };

            var response = ConferenceForUserResponseMapper.MapConferenceSummaryToResponseModel(conference);

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseType.Should().Be(conference.Case_type);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.NoOfParticipantsAvailable.Should().Be(1);
            response.NoOfParticipantsInConsultation.Should().Be(4);
            response.NoOfParticipantsUnavailable.Should().Be(2);
            response.NoOfPendingTasks.Should().Be(conference.Pending_tasks);
            response.HearingVenueName.Should().Be(conference.Hearing_venue_name);
            response.Tasks.Count.Should().Be(1);
            response.Tasks[0].Id.Should().Be(1);
            response.Tasks[0].Body.Should().Be("self-test");
        }
    }
}
