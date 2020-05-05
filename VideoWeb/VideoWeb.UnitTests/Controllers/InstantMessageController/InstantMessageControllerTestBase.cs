using System;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public abstract class InstantMessageControllerTestBase
    {
        protected InstantMessagesController Controller;
        protected Mock<IVideoApiClient> VideoApiClientMock;
        protected Mock<IMessageDecoder> MessageDecoder;
        protected Mock<ILogger<InstantMessagesController>> MockLogger;
        protected Mock<IConferenceCache> ConferenceCache;

        [SetUp]
        public void Setup()
        {
            ConferenceCache = new Mock<IConferenceCache>();
            VideoApiClientMock = new Mock<IVideoApiClient>();
            MessageDecoder = new Mock<IMessageDecoder>();
            MockLogger = new Mock<ILogger<InstantMessagesController>>();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            Controller =
                new InstantMessagesController(VideoApiClientMock.Object, MockLogger.Object, MessageDecoder.Object,
                    ConferenceCache.Object)
                {
                    ControllerContext = context
                };

            MessageDecoder.Setup(x =>
                    x.GetMessageOriginatorAsync(It.IsAny<Conference>(),
                        It.IsAny<InstantMessageResponse>()))
                .ReturnsAsync("Johnny");

            MessageDecoder.Setup(x => x.IsMessageFromUser(It.IsAny<InstantMessageResponse>(), It.IsAny<string>()))
                .Returns<InstantMessageResponse, string>((message, loggedInUsername) =>
                    message.From.Equals(loggedInUsername, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
