using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConferenceManagementNonHost;

public class ConferenceManagementNonHostControllerTestBase
{
    protected AutoMock Mocker;
    protected Conference TestConference;
    
    protected ConferenceManagementNonHostController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
    {
        Mocker = AutoMock.GetLoose();
        var sut = Mocker.Create<ConferenceManagementNonHostController>();
        sut.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        Mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(TestConference);

        return sut;
    }
}

public class NonHostLeaveHearingTests : ConferenceManagementNonHostControllerTestBase
{
    private ConferenceManagementNonHostController _controller;
    private Participant _individual;

    [SetUp]
    public void Setup()
    {
        TestConference = new ConferenceCacheModelBuilder().Build();
        _individual = TestConference.Participants.First(x => x.Role == Role.Individual);
        var user = new ClaimsPrincipalBuilder()
            .WithUsername(_individual.Username)
            .WithRole(AppRoles.CitizenRole).Build();
        
        _controller = SetupControllerWithClaims(user);
    }

    [Test]
    public void should_call_service_and_return_accepted()
    {
        // Act
        var result = _controller.NonHostLeaveHearingAsync(TestConference.Id, CancellationToken.None).Result;

        // Assert
        Mocker.Mock<IConferenceManagementService>()
            .Verify(
                x => x.ParticipantLeaveConferenceAsync(TestConference.Id, _individual.Username, CancellationToken.None),
                Times.Once);
        result.Should().BeOfType<AcceptedResult>();
    }
}
