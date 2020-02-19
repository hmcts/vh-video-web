using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.MessageController
{
    public class GetConferenceChatHistoryTests
    {
        private MessagesController _controller;
        private Mock<IVideoApiClient> _videoApiClientMock;
        private Mock<IMessageDecoder> _messageDecoder;
        private Mock<ILogger<MessagesController>> _mockLogger;
        
        [SetUp]
        public void Setup()
        {
            _videoApiClientMock = new Mock<IVideoApiClient>();
            _messageDecoder = new Mock<IMessageDecoder>();
            _mockLogger = new Mock<ILogger<MessagesController>>();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _controller =
                new MessagesController(_videoApiClientMock.Object, _mockLogger.Object, _messageDecoder.Object)
                {
                    ControllerContext = context
                };

            _messageDecoder.Setup(x => x.GetMessageOriginatorAsync(It.IsAny<ConferenceDetailsResponse>(), It.IsAny<MessageResponse>()))
                .ReturnsAsync("Johnny");
            
            _messageDecoder.Setup(x => x.IsMessageFromUser(It.IsAny<MessageResponse>(), It.IsAny<string>()))
                .Returns(true);
        }

        [Test]
        public async Task should_return_okay_code_when_chat_history_is_found()
        {
            var conferenceId = Guid.NewGuid();
            var messages = Builder<MessageResponse>.CreateListOfSize(5).Build().ToList();
            _videoApiClientMock.Setup(x => x.GetMessagesAsync(conferenceId))
                .ReturnsAsync(messages);
            
            var result = await _controller.GetConferenceChatHistory(conferenceId);
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
            var messages = new List<MessageResponse>();
            _videoApiClientMock.Setup(x => x.GetMessagesAsync(conferenceId))
                .ReturnsAsync(messages);
            
            var result = await _controller.GetConferenceChatHistory(conferenceId);
            var typedResult = (OkObjectResult) result;
            typedResult.Should().NotBeNull();
            var responseModel = typedResult.Value as List<ChatResponse>;
            responseModel.Should().BeEmpty();
        }

        [Test]
        public async Task should_return_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _videoApiClientMock.Setup(x => x.GetMessagesAsync(conferenceId))
                .ThrowsAsync(apiException);
            
            var result = await _controller.GetConferenceChatHistory(conferenceId);
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }
    }
}
