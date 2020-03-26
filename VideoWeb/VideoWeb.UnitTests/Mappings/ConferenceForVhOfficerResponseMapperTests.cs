using System;
using System.Collections.Generic;
using System.Linq;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Mappings
{
    public class ConferenceForVhOfficerResponseMapperTests
    {
        [Test]
        public void should_map_and_count_number_of_messages_since_vho_message()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.User_role = UserRole.Judge)
                .TheRest().With(x => x.User_role = UserRole.Individual).Build().ToList();

            var judge = participants.Single(x => x.User_role == UserRole.Judge);
            const string vho1Username = "vho1@hmcts.net";
            const string vho2Username = "vho2@hmcts.net";

            var conference = Builder<ConferenceSummaryResponse>.CreateNew().With(x => x.Participants = participants)
                .Build();

            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 5", Time_stamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 4", Time_stamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = vho1Username, Message_text = "vho - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-3)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 3", Time_stamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = vho2Username, Message_text = "vho2 - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-5)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 2", Time_stamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-7)},
            };

            var response =
                ConferenceForVhOfficerResponseMapper.MapConferenceSummaryToResponseModel(conference, messages);

            response.NumberOfUnreadMessages.Should().Be(2);
        }

        [Test]
        public void should_map_and_return_total_message_count_when_vho_has_not_answered()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.User_role = UserRole.Judge)
                .TheRest().With(x => x.User_role = UserRole.Individual).Build().ToList();

            var judge = participants.Single(x => x.User_role == UserRole.Judge);

            var conference = Builder<ConferenceSummaryResponse>.CreateNew().With(x => x.Participants = participants)
                .Build();

            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 5", Time_stamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 4", Time_stamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 3", Time_stamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 2", Time_stamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-7)},
            };

            var response =
                ConferenceForVhOfficerResponseMapper.MapConferenceSummaryToResponseModel(conference, messages);

            response.NumberOfUnreadMessages.Should().Be(messages.Count);
        }

        [Test]
        public void Should_map_all_properties()
        {
            var conference = Builder<ConferenceSummaryResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Hearing_ref_id = Guid.NewGuid())
                .Build();

            var participants = new List<ParticipantSummaryResponse>
            {
                new ParticipantSummaryResponseBuilder(UserRole.Individual)
                    .WithStatus(ParticipantState.Available).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Representative)
                    .WithStatus(ParticipantState.Disconnected).Build(),
                new ParticipantSummaryResponseBuilder(UserRole.Judge)
                    .WithStatus(ParticipantState.NotSignedIn).Build()
            };

            conference.Participants = participants;
            conference.Tasks = new List<TaskResponse>
                {new TaskResponse {Id = 1, Status = TaskStatus.ToDo, Body = "self-test"}};

            var response =
                ConferenceForVhOfficerResponseMapper.MapConferenceSummaryToResponseModel(conference,
                    new List<InstantMessageResponse>());

            response.Id.Should().Be(conference.Id);
            response.CaseName.Should().Be(conference.Case_name);
            response.CaseNumber.Should().Be(conference.Case_number);
            response.CaseType.Should().Be(conference.Case_type);
            response.ScheduledDateTime.Should().Be(conference.Scheduled_date_time);
            response.ScheduledDuration.Should().Be(conference.Scheduled_duration);
            response.Status.ToString().Should().Be(conference.Status.ToString());
            response.NoOfPendingTasks.Should().Be(conference.Pending_tasks);
            response.HearingVenueName.Should().Be(conference.Hearing_venue_name);
            response.Tasks.Count.Should().Be(1);
            response.Tasks[0].Id.Should().Be(1);
            response.Tasks[0].Body.Should().Be("self-test");
            response.Participants.Count.Should().Be(participants.Count);
        }
    }
}
