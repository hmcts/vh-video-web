using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public class GetConferenceInstantMessageHistoryTests : InstantMessageControllerTestBase
    {
        [Test]
        public async Task Should_return_okay_code_when_chat_history_is_found()
        {
            var conference = InitConference();

            var conferenceId = conference.Id;
            var participantUsername = conference.Participants[0].Id.ToString();
            var messages = Builder<InstantMessageResponse>.CreateListOfSize(5).Build().ToList();
            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Username))
                .ReturnsAsync(messages);
            mocker.Mock<IConferenceCache>()
               .Setup(x => x.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
               .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
               .ReturnsAsync(conference);

            var result = await sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, Guid.Parse(participantUsername));

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().NotBeNullOrEmpty();
            responseModel?.Count.Should().Be(messages.Count);
            responseModel?.Should().BeInAscendingOrder(r => r.Timestamp);
        }

        [Test]
        public async Task Should_return_okay_code_when_chat_history_is_empty()
        {
            var conference = InitConference();

            var conferenceId = conference.Id;
            var participantUsername = conference.Participants[0].Id.ToString();
            var messages = new List<InstantMessageResponse>();
            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Username))
                .ReturnsAsync(messages);
            mocker.Mock<IConferenceCache>()
              .Setup(x => x.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
              .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
              .ReturnsAsync(conference);
            var result = await sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, Guid.Parse(participantUsername));
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().BeEmpty();
        }

        [Test]
        public async Task Should_map_originators_when_message_is_not_from_user()
        {
            var conference = InitConference();

            var conferenceId = conference.Id;
            var messages = Builder<InstantMessageResponse>.CreateListOfSize(5)
                .TheFirst(2)
                .With(x => x.From = "john@doe.com").TheNext(3)
                .With(x => x.From = "some@other.com")
                .Build().ToList();

            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Username))
                .ReturnsAsync(messages);
            mocker.Mock<IConferenceCache>()
             .Setup(x => x.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
             .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
             .ReturnsAsync(conference);

            var result = await sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Id);

            mocker.Mock<IMessageDecoder>().Verify(x => x.IsMessageFromUser(
                    It.Is<InstantMessageResponse>(m => m.From == conference.Participants[0].Username), conference.Participants[0].Username),
                Times.Exactly(2));

            mocker.Mock<IMessageDecoder>().Verify(x => x.IsMessageFromUser(
                    It.Is<InstantMessageResponse>(m => m.From == "some@other.com"), conference.Participants[0].Username),
                Times.Exactly(3));

            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel?.Count(x => x.FromDisplayName == "You").Should().Be(2);
          
        }

        [Test]
        public async Task Should_return_exception()
        {
            var conference = InitConference();

            var conferenceId = conference.Id;
            var participantUsername = conference.Participants[0].Username;
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryForParticipantAsync(conferenceId, participantUsername))
                .ThrowsAsync(apiException);
            mocker.Mock<IConferenceCache>()
             .Setup(x => x.GetOrAddConferenceAsync(conferenceId, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
             .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
             .ReturnsAsync(conference);

            var result = await sut.GetConferenceInstantMessageHistoryForParticipantAsync(conferenceId, conference.Participants[0].Id);
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }

        private static Conference InitConference()
        {
            var participants = Builder<Participant>.CreateListOfSize(5)
                .All()
                .With(x => x.Id = Guid.NewGuid())
                .TheFirst(1)
                .With(x => x.Username = "john@doe.com")
                .TheLast(1)
                .With(x => x.Username = "some@other.com")
                .TheFirst(1).With(x => x.Role = Role.Judge)
                .TheRest().With(x => x.Role = Role.Individual).Build().ToList();



            return Builder<Conference>.CreateNew().With(x => x.Id = Guid.NewGuid())
                .With(x => x.Participants = participants).Build();
        }
    }
}
