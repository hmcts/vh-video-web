using System;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController
{
    public abstract class InstantMessageControllerTestBase
    {
        protected AutoMock mocker;
        protected InstantMessagesController sut;

        [SetUp]
        public void Setup()
        {
            mocker = AutoMock.GetLoose();

            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            var parameters = new ParameterBuilder(mocker)
                .AddTypedParameters<UnreadInstantMessageConferenceCountResponseMapper>()
                .AddTypedParameters<UnreadAdminMessageResponseMapper>()
                .AddTypedParameters<ChatResponseMapper>()
                .Build();
            sut = mocker.Create<InstantMessagesController>(parameters);
            sut.ControllerContext = context;

            mocker.Mock<IMessageDecoder>().Setup(x =>
                    x.GetMessageOriginatorAsync(It.IsAny<Conference>(),
                        It.IsAny<InstantMessageResponse>()))
                .ReturnsAsync("Johnny");

            mocker.Mock<IMessageDecoder>().Setup(x => x.IsMessageFromUser(It.IsAny<InstantMessageResponse>(), It.IsAny<string>()))
                .Returns<InstantMessageResponse, string>((message, loggedInUsername) =>
                    message.From.Equals(loggedInUsername, StringComparison.InvariantCultureIgnoreCase));
        }
    }
}
