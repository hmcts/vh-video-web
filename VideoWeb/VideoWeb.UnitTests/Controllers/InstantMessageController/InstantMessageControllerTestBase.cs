using System;
using System.Collections.Generic;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Helpers;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
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

            mocker.Mock<IMapperFactory>().Setup(x => x.Get<Conference, IList<InstantMessageResponse>, UnreadInstantMessageConferenceCountResponse>()).Returns(mocker.Create<UnreadInstantMessageConferenceCountResponseMapper>());
            mocker.Mock<IMapperFactory>().Setup(x => x.Get<Conference, IList<InstantMessageResponse>, UnreadAdminMessageResponse>()).Returns(mocker.Create<UnreadAdminMessageResponseMapper>());
            mocker.Mock<IMapperFactory>().Setup(x => x.Get<InstantMessageResponse, string, bool, Conference, ChatResponse>()).Returns(mocker.Create<ChatResponseMapper>());

            sut = mocker.Create<InstantMessagesController>();
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
