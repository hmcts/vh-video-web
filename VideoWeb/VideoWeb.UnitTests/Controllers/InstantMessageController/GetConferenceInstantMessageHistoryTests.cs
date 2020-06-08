using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public class GetConferenceInstantMessageHistoryTests : InstantMessageControllerTestBase
    {

        [Test]
        public async Task Should_return_okay_code_when_chat_history_is_found()
        {
            var conferenceId = Guid.NewGuid();
            var messages = Builder<InstantMessageResponse>.CreateListOfSize(5).Build().ToList();
            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(messages);

            var result = await Controller.GetConferenceInstantMessageHistoryAsync(conferenceId);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().NotBeNullOrEmpty();
            responseModel?.Count.Should().Be(messages.Count);
            responseModel.Should().BeInAscendingOrder(m => m.Timestamp);
        }

        [Test]
        public async Task Should_return_okay_code_when_chat_history_is_empty()
        {
            var conferenceId = Guid.NewGuid();
            var messages = new List<InstantMessageResponse>();
            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(messages);

            var result = await Controller.GetConferenceInstantMessageHistoryAsync(conferenceId);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().BeEmpty();
        }

        [Test]
        public async Task Should_map_originators_when_message_is_not_from_user()
        {
            var conferenceId = Guid.NewGuid();
            var loggedInUser = "john@doe.com";
            var otherUsername = "some@other.com";
            var messages = Builder<InstantMessageResponse>.CreateListOfSize(5)
                .TheFirst(2)
                .With(x => x.From = loggedInUser).TheNext(3)
                .With(x => x.From = otherUsername)
                .Build().ToList();
            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(messages);

            var result = await Controller.GetConferenceInstantMessageHistoryAsync(conferenceId);

            MessageDecoder.Verify(x => x.IsMessageFromUser(
                    It.Is<InstantMessageResponse>(m => m.From == loggedInUser), loggedInUser),
                Times.Exactly(2));

            MessageDecoder.Verify(x => x.IsMessageFromUser(
                    It.Is<InstantMessageResponse>(m => m.From == otherUsername), loggedInUser),
                Times.Exactly(3));

            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel?.Count(x => x.FromDisplayName == "You").Should().Be(2);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            VideoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ThrowsAsync(apiException);

            var result = await Controller.GetConferenceInstantMessageHistoryAsync(conferenceId);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
    }
}
