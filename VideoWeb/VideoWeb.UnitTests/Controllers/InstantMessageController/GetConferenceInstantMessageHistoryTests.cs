using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public class GetConferenceInstantMessageHistoryTests
    {
        private InstantMessagesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IMessageDecoder> _messageDecoder;
        private Mock<ILogger<InstantMessagesController>> _mockLogger;
        private IMemoryCache _memoryCache;

        [SetUp]
        public void Setup()
        {
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _messageDecoder = new Mock<IMessageDecoder>();
            _mockLogger = new Mock<ILogger<InstantMessagesController>>();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new InstantMessagesController(_videoApiClientMock.Object, _mockLogger.Object, _messageDecoder.Object,
                    _memoryCache)
                {
                    ControllerContext = context
                };

            _messageDecoder.Setup(x =>
                    x.GetMessageOriginatorAsync(It.IsAny<ConferenceDetailsResponse>(),
                        It.IsAny<InstantMessageResponse>()))
                .ReturnsAsync("Johnny");

            _messageDecoder.Setup(x => x.IsMessageFromUser(It.IsAny<InstantMessageResponse>(), It.IsAny<string>()))
                .Returns<InstantMessageResponse, string>((message, loggedInUsername) =>
                    message.From.Equals(loggedInUsername, StringComparison.InvariantCultureIgnoreCase));
        }

        [Test]
        public async Task should_return_okay_code_when_chat_history_is_found()
        {
            var conferenceId = Guid.NewGuid();
            var messages = Builder<InstantMessageResponse>.CreateListOfSize(5).Build().ToList();
            _videoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(messages);

            var result = await _controller.GetConferenceInstantMessageHistoryAsync(conferenceId);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().NotBeNullOrEmpty();
            responseModel?.Count.Should().Be(messages.Count);
        }

        [Test]
        public async Task should_return_okay_code_when_chat_history_is_empty()
        {
            var conferenceId = Guid.NewGuid();
            var messages = new List<InstantMessageResponse>();
            _videoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(messages);

            var result = await _controller.GetConferenceInstantMessageHistoryAsync(conferenceId);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().BeEmpty();
        }

        [Test]
        public async Task should_map_originators_when_message_is_not_from_user()
        {

            var conferenceId = Guid.NewGuid();
            var loggedInUser = "john@doe.com";
            var otherUsername = "some@other.com";
            var messages = Builder<InstantMessageResponse>.CreateListOfSize(5)
                .TheFirst(2)
                .With(x => x.From = loggedInUser).TheNext(3)
                .With(x => x.From = otherUsername)
                .Build().ToList();
            _videoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ReturnsAsync(messages);

            var result = await _controller.GetConferenceInstantMessageHistoryAsync(conferenceId);

            _messageDecoder.Verify(x => x.IsMessageFromUser(
                    It.Is<InstantMessageResponse>(m => m.From == loggedInUser), loggedInUser),
                Times.Exactly(2));

            _messageDecoder.Verify(x => x.IsMessageFromUser(
                    It.Is<InstantMessageResponse>(m => m.From == otherUsername), loggedInUser),
                Times.Exactly(3));

            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel?.Count(x => x.From == "You").Should().Be(2);
        }

        [Test]
        public async Task should_return_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock.Setup(x => x.GetInstantMessageHistoryAsync(conferenceId))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferenceInstantMessageHistoryAsync(conferenceId);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
    }
}
