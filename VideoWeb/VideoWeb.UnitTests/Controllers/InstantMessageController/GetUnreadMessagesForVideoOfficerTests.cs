using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public class GetUnreadMessagesForVideoOfficerTests : InstantMessageControllerTestBase
    {
        [Test]
        public async Task Should_return_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ThrowsAsync(apiException);

            var result = await sut.GetUnreadMessagesForVideoOfficerAsync(conferenceId);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_okay_code_and_zero_unread_messages_when_there_is_no_im_history()
        {
            var conferenceId = Guid.NewGuid();
            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(new List<InstantMessageResponse>());

            var result = await sut.GetUnreadMessagesForVideoOfficerAsync(conferenceId);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = (UnreadInstantMessageConferenceCountResponse)typedResult.Value;
            responseModel.NumberOfUnreadMessagesConference.Count.Should().Be(0);
        }

        [Test]
        public async Task should_return_okay_code_and_number_of_unread_messages_since_vho_responded_last()
        {
            var conference = InitConference();
            var messages = InitMessages(conference);
            mocker.Mock<IConferenceService>()
                .Setup(x => x.GetConference(It.Is<Guid>(id => id == conference.Id)))
                .ReturnsAsync(conference);
            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                .ReturnsAsync(messages);

            var result = await sut.GetUnreadMessagesForVideoOfficerAsync(conference.Id);

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = (UnreadInstantMessageConferenceCountResponse)typedResult.Value;
            responseModel.NumberOfUnreadMessagesConference.Should().NotBeNull();
            responseModel.NumberOfUnreadMessagesConference.Sum(m => m.NumberOfUnreadMessages).Should().Be(5);
            responseModel.NumberOfUnreadMessagesConference[0].NumberOfUnreadMessages.Should().Be(2);
            responseModel.NumberOfUnreadMessagesConference[1].NumberOfUnreadMessages.Should().Be(3);
            responseModel.NumberOfUnreadMessagesConference[2].NumberOfUnreadMessages.Should().Be(0);
            responseModel.NumberOfUnreadMessagesConference[3].NumberOfUnreadMessages.Should().Be(0);
        }

        private static Conference InitConference()
        {
            var participants = Builder<Participant>.CreateListOfSize(4)
                .All()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Username = Internet.Email())
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheRest().With(x => x.Role = Role.Individual).Build().ToList();

            return Builder<Conference>.CreateNew().With(x => x.Id = Guid.NewGuid())
                .With(x => x.Participants = participants).Build();
        }

        private static List<InstantMessageResponse> InitMessages(Conference conference)
        {
            var judge = conference.Participants.Single(x => x.Role == Role.Judge);
            var individual = conference.Participants.First(x => x.Role == Role.Individual);
            const string vho1Username = "vho1@hmcts.net";
            const string vho2Username = "vho2@hmcts.net";

            return new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 5", TimeStamp = DateTime.UtcNow.AddMinutes(-1), To = vho1Username},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 4", TimeStamp = DateTime.UtcNow.AddMinutes(-2), To = vho1Username},
                new InstantMessageResponse
                    {From = vho1Username, MessageText = "vho - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-3), To = judge.Username},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 3", TimeStamp = DateTime.UtcNow.AddMinutes(-4), To = vho1Username},
                new InstantMessageResponse
                    {From = vho2Username, MessageText = "vho2 - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-5), To = judge.Username},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 2", TimeStamp = DateTime.UtcNow.AddMinutes(-6), To = vho1Username},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-7), To = vho1Username}, 
                new InstantMessageResponse
                    {From = individual.Username, MessageText = "individual - 3", TimeStamp = DateTime.UtcNow.AddMinutes(-8), To = vho1Username},
                new InstantMessageResponse
                    {From = individual.Username, MessageText = "individual - 2", TimeStamp = DateTime.UtcNow.AddMinutes(-9), To = vho1Username},
                new InstantMessageResponse
                    {From = individual.Username, MessageText = "individual - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-10), To = vho1Username},
                new InstantMessageResponse
                    {From = vho1Username, MessageText = "vho - ind - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-11), To = individual.Username},
            };
        }
    }
}
