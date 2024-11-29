using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;
using FluentAssertions;

namespace VideoWeb.UnitTests.Controllers.ParticipantController;

public class GetCurrentParticipantTests
{
    private AutoMock _mocker;
    private ParticipantsController _sut;
    private Conference _testConference;
    private Participant _currentParticipant;
    private ClaimsPrincipal _currentUser;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext()
        };
        _sut = _mocker.Create<ParticipantsController>();
        _sut.ControllerContext = context;

        _testConference = CreateConference();
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(_testConference.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testConference);
    }
    
    [Test]
    public async Task Should_return_ok_when_current_user_is_conference_participant()
    {
        // Arrange
        _currentParticipant = _testConference.GetJudge();
        SetCurrentUser(AppRoles.JudgeRole, _currentParticipant.Username);
        
        // Act
        var result = await _sut.GetCurrentParticipantAsync(_testConference.Id, It.IsAny<CancellationToken>());

        // Assert
        var typedResult = (OkObjectResult)result;
        var response = (LoggedParticipantResponse)typedResult.Value;
        response.Should().NotBeNull();
        response.ParticipantId.Should().Be(_currentParticipant.Id);
        response.DisplayName.Should().Be(_currentParticipant.DisplayName);
        response.Role.Should().Be(_currentParticipant.Role);
    }

    [Test]
    public async Task Should_return_ok_when_current_user_is_vho()
    {
        // Arrange
        SetCurrentUser(AppRoles.VhOfficerRole, "vho@email.com");
        
        // Act
        var result = await _sut.GetCurrentParticipantAsync(_testConference.Id, It.IsAny<CancellationToken>());
        
        // Assert
        var typedResult = (OkObjectResult)result;
        var response = (LoggedParticipantResponse)typedResult.Value;
        response.Should().NotBeNull();
        response.AdminUsername.Should().Be(_currentUser.Identity.Name);
        response.DisplayName.Should().Be("Admin");
        response.Role.Should().Be(Role.VideoHearingsOfficer);
    }

    [Test]
    public async Task Should_return_not_found_when_current_participant_not_found()
    {
        // Arrange
        SetCurrentUser(AppRoles.JudgeRole, "notFound@email.com");
        
        // Act
        var result = await _sut.GetCurrentParticipantAsync(_testConference.Id, It.IsAny<CancellationToken>());
        
        // Assert
        result.Should().NotBeNull();
        result.Should().BeOfType<NotFoundObjectResult>();
    }
    
    private static Conference CreateConference()
    {
        var judge = new ParticipantBuilder(Role.Judge).Build();
        judge.Username = "judge@email.com";
        var participants = new List<Participant> { judge };
        
        var conference = Builder<Conference>.CreateNew()
            .With(x => x.Participants = participants)
            .With(x => x.IsWaitingRoomOpen = true)
            .Build();
        return conference;
    }

    private void SetCurrentUser(string role, string username)
    {
        _currentUser = new ClaimsPrincipalBuilder()
            .WithRole(role)
            .WithUsername(username)
            .Build();
        
        _sut.ControllerContext.HttpContext.User = _currentUser;
    }
}
