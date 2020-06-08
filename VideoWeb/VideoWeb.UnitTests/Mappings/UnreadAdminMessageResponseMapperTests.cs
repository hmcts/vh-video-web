using System;
using System.Collections.Generic;
using System.Linq;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class UnreadAdminMessageResponseMapperTests
    {
        [Test]
        public void Should_map_and_count_number_of_messages_since_vho_message()
        {
            var participants = Builder<Participant>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheRest().With(x => x.Role = Role.Individual).Build().ToList();

            var judge = participants.Single(x => x.Role == Role.Judge);
            const string vho1Username = "vho1@hmcts.net";
            const string vho2Username = "vho2@hmcts.net";

            var conference = Builder<Conference>.CreateNew().With(x => x.Participants = participants)
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
                UnreadAdminMessageResponseMapper.MapToResponseModel(conference, messages);

            response.NumberOfUnreadMessages.Should().Be(2);
        }

        [Test]
        public void Should_map_and_return_total_message_count_when_vho_has_not_answered()
        {
            var participants = Builder<Participant>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheRest().With(x => x.Role = Role.Individual).Build().ToList();

            var judge = participants.Single(x => x.Role == Role.Judge);

            var conference = Builder<Conference>.CreateNew().With(x => x.Participants = participants)
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
                UnreadAdminMessageResponseMapper.MapToResponseModel(conference, messages);

            response.NumberOfUnreadMessages.Should().Be(messages.Count);
        }

        [Test]
        public void should_map_total_message_count_when_there_is_no_chat_history()
        {
            var participants = Builder<Participant>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheRest().With(x => x.Role = Role.Individual).Build().ToList();

            var conference = Builder<Conference>.CreateNew().With(x => x.Participants = participants)
                .Build();

            var messages = new List<InstantMessageResponse>();

            var response1 =
                UnreadAdminMessageResponseMapper.MapToResponseModel(conference, messages);
            var response2 =
                UnreadAdminMessageResponseMapper.MapToResponseModel(conference, null);

            response1.NumberOfUnreadMessages.Should().Be(0);
            response2.NumberOfUnreadMessages.Should().Be(0);
        }
    }
}
