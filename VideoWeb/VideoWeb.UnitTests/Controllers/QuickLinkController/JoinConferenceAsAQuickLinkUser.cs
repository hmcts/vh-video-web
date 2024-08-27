using System;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Services;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.QuickLinkController;

public class JoinConferenceAsAQuickLinkUser
{
    private QuickLinksController _controller;
    private AutoMock _mocker;
    
    [SetUp]
    public void SetUp()
    {
        _mocker = AutoMock.GetLoose();
        _controller = _mocker.Create<QuickLinksController>();
    }
    
    [Test]
    public async Task Should_update_conference_cache_and_return_a_token()
    {
        // Arrange
        var hearingId = Guid.NewGuid();
        var conferenceId = Guid.NewGuid();
        var name = "First Last";
        var role = Role.QuickLinkParticipant;
        var userRole = UserRole.QuickLinkParticipant;
        var jwt = "JWT";
        var participantDetails = new ParticipantResponse();
        var quickLinkJoinResponse = new AddQuickLinkParticipantResponse
        {
            Participant = participantDetails,
            Token = jwt,
            ConferenceId = conferenceId
        };
        
        _mocker.Mock<IVideoApiClient>().Setup(x => x.AddQuickLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
            It.Is<AddQuickLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole))).ReturnsAsync(quickLinkJoinResponse);
        
        // Act
        var result = await _controller.Join(hearingId, new QuickLinkParticipantJoinRequest
        {
            Name = name,
            Role = role
        });
        
        // Assert
        var objectResult = result.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().BeAssignableTo<QuickLinkParticipantJoinResponse>().Which;
        objectResult.Jwt.Should().Be(jwt);
        
        _mocker.Mock<IParticipantService>().Verify(x => x.AddParticipantToConferenceCache(quickLinkJoinResponse.ConferenceId, quickLinkJoinResponse.Participant), Times.Once);
        _mocker.Mock<IVideoApiClient>().Verify(x => x.AddQuickLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
            It.Is<AddQuickLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole)), Times.Once);
    }
    
    [Test]
    public async Task Should_return_a_status_code_when_a_video_api_exception_is_thrown()
    {
        // Arrange
        var hearingId = Guid.NewGuid();
        var name = "First Last";
        var role = Role.QuickLinkParticipant;
        var userRole = UserRole.QuickLinkParticipant;
        var statusCode = 500;
        var response = "response";
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(
                x => x.AddQuickLinkParticipantAsync(It.IsAny<Guid>(), It.IsAny<AddQuickLinkParticipantRequest>()))
            .ThrowsAsync(new VideoApiException("Error", statusCode, response, null, null));
        
        // Act
        var result = await _controller.Join(hearingId, new QuickLinkParticipantJoinRequest
        {
            Name = name,
            Role = role
        });
        
        // Assert
        var objectResult = result.Should().BeAssignableTo<ObjectResult>().Which;
        objectResult.StatusCode.Should().Be(statusCode);
        objectResult.Value.Should().BeAssignableTo<string>().Which.Should().Be(response);
        _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>(), It.IsAny<CancellationToken>()), Times.Never());
        _mocker.Mock<IVideoApiClient>().Verify(x => x.AddQuickLinkParticipantAsync(It.Is<Guid>(y => y == hearingId),
            It.Is<AddQuickLinkParticipantRequest>(y => y.Name == name && y.UserRole == userRole)), Times.Once);
    }
    
    [TestCase(Role.Individual)]
    [TestCase(Role.Judge)]
    [TestCase(Role.None)]
    [TestCase(Role.Representative)]
    [TestCase(Role.CaseAdmin)]
    [TestCase(Role.HearingFacilitationSupport)]
    [TestCase(Role.JudicialOfficeHolder)]
    [TestCase(Role.VideoHearingsOfficer)]
    public async Task Should_return_a_bad_request_code_when_invalid_role(Role role)
    {
        // Arrange
        var hearingId = Guid.NewGuid();
        var name = "First Last";
        var statusCode = StatusCodes.Status400BadRequest;
        
        // Act
        var result = await _controller.Join(hearingId, new QuickLinkParticipantJoinRequest
        {
            Name = name,
            Role = role
        });
        
        // Assert
        var objectResult = result.Should().BeAssignableTo<ObjectResult>().Which;
        objectResult.StatusCode.Should().Be(statusCode);
        objectResult.Value.Should().BeAssignableTo<string>().Which.Should().NotBeEmpty();
        _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>(), It.IsAny<CancellationToken>()), Times.Never());
        _mocker.Mock<IVideoApiClient>().Verify(x => x.AddQuickLinkParticipantAsync(It.IsAny<Guid>(),
            It.IsAny<AddQuickLinkParticipantRequest>()), Times.Never);
    }
}
