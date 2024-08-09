using System;
using Autofac.Extras.Moq;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.Helpers;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.InstantMessageController;

public abstract class InstantMessageControllerTestBase
{
    protected AutoMock Mocker;
    protected InstantMessagesController Sut;
    
    [SetUp]
    public void Setup()
    {
        Mocker = AutoMock.GetLoose();
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        Sut = Mocker.Create<InstantMessagesController>();
        Sut.ControllerContext = context;
        
        Mocker.Mock<IMessageDecoder>().Setup(x =>
                x.GetMessageOriginatorAsync(It.IsAny<Conference>(),
                    It.IsAny<InstantMessageResponse>()))
            .ReturnsAsync("Johnny");
        
        Mocker.Mock<IMessageDecoder>().Setup(x => x.IsMessageFromUser(It.IsAny<InstantMessageResponse>(), It.IsAny<string>()))
            .Returns<InstantMessageResponse, string>((message, loggedInUsername) =>
                message.From.Equals(loggedInUsername, StringComparison.InvariantCultureIgnoreCase));
    }
}
