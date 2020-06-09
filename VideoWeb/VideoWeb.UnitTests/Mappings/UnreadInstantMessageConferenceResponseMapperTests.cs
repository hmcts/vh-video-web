using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class UnreadInstantMessageConferenceResponseMapperTests
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
                    {From = judge.Username, Message_text = "judge - 5", Time_stamp = DateTime.UtcNow.AddMinutes(-1), To = vho1Username
},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 4", Time_stamp = DateTime.UtcNow.AddMinutes(-2), To = vho1Username},
                new InstantMessageResponse
                    {From = vho1Username, Message_text = "vho - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-3), To = judge.Username},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 3", Time_stamp = DateTime.UtcNow.AddMinutes(-4), To = vho1Username},
                new InstantMessageResponse
                    {From = vho2Username, Message_text = "vho2 - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-5), To = judge.Username},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 2", Time_stamp = DateTime.UtcNow.AddMinutes(-6), To = vho1Username},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-7), To = vho1Username},
            };

            var response =
                UnreadInstantMessageConferenceResponseMapper.MapToResponseModel(conference, messages);

            response.NumberOfUnreadMessagesConference[0].NumberOfUnreadMessages = 2;
            response.NumberOfUnreadMessagesConference[0].ParticipantUsername = judge.Username;
            response.NumberOfUnreadMessagesConference.Sum(m => m.NumberOfUnreadMessages).Should().Be(2);
        }
    }
}
