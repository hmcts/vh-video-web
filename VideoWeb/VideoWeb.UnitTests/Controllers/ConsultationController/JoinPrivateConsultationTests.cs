using System;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;
using ConsultationAnswer = VideoApi.Contract.Requests.ConsultationAnswer;

namespace VideoWeb.UnitTests.Controllers.ConsultationController;

[TestFixture]
public class JoinPrivateConsultationTests
{
    private AutoMock _mocker;
    private ConsultationsController _consultationsController;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        _consultationsController = _mocker.Create<ConsultationsController>();
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        _consultationsController.ControllerContext = context;
    }
    
    [Test]
    public async Task JoinPrivateConsultation_Success_ReturnAccepted()
    {
        // Arrange
        Guid expectedConferenceId = Guid.NewGuid();
        Guid expectedParticipantId = Guid.NewGuid();
        string expectedRoomLabel = "ExpectedRoomLabel";
        
        Conference conference = new Conference();
        conference.Id = expectedConferenceId;
        conference.Participants.Add(new Participant()
        {
            Id = expectedParticipantId,
            Username = ClaimsPrincipalBuilder.Username
        });
        
        
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == conference.Id))).ReturnsAsync(conference);
        
        JoinPrivateConsultationRequest request = new JoinPrivateConsultationRequest()
        {
            ConferenceId = expectedConferenceId,
            ParticipantId = expectedParticipantId,
            RoomLabel = expectedRoomLabel
        };
        
        // Act
        var result = await _consultationsController.JoinPrivateConsultation(request);
        
        // Assert
        result.Should().BeAssignableTo<AcceptedResult>();
        
        _mocker.Mock<IConsultationNotifier>().Verify(x => x.NotifyParticipantTransferring(
            It.Is<Conference>(c => c == conference),
            It.Is<Guid>(id => id == expectedParticipantId),
            It.Is<string>(room => room == expectedRoomLabel)), Times.Once);
        
        _mocker.Mock<IVideoApiClient>().Verify(x => x.RespondToConsultationRequestAsync(It.Is<ConsultationRequestResponse>(y =>
            y.Answer == ConsultationAnswer.Accepted &&
            y.ConferenceId == expectedConferenceId &&
            y.RequestedBy == expectedParticipantId &&
            y.RequestedFor == expectedParticipantId &&
            y.RoomLabel == expectedRoomLabel)), Times.Once);
    }
    
    [Test]
    public async Task JoinPrivateConsultation_ParticipantNotFound_ReturnNotFound()
    {
        // Arrange
        Guid expectedConferenceId = Guid.NewGuid();
        Guid expectedParticipantId = Guid.NewGuid();
        string expectedRoomLabel = "ExpectedRoomLabel";
        
        Conference conference = new Conference();
        conference.Id = expectedConferenceId;
        conference.Participants.Add(new Participant()
        {
            Id = Guid.NewGuid(),
            Username = ClaimsPrincipalBuilder.Username
        });
        _mocker.Mock<IConferenceService>().Setup(x => x.GetConference(It.Is<Guid>(y => y == expectedConferenceId))).ReturnsAsync(conference);
        
        JoinPrivateConsultationRequest request = new JoinPrivateConsultationRequest()
        {
            ConferenceId = expectedConferenceId,
            ParticipantId = expectedParticipantId,
            RoomLabel = expectedRoomLabel
        };
        
        // Act
        var result = await _consultationsController.JoinPrivateConsultation(request);
        
        // Assert
        result.Should().BeAssignableTo<NotFoundObjectResult>();
        result.As<NotFoundObjectResult>().Value.As<string>().Should().Contain("participant");
        
        _mocker.Mock<IConsultationNotifier>().Verify(x => x.NotifyParticipantTransferring(
            It.Is<Conference>(c => c == conference),
            It.Is<Guid>(id => id == expectedParticipantId),
            It.Is<string>(room => room == expectedRoomLabel)), Times.Never);
        
        _mocker.Mock<IVideoApiClient>().Verify(x => x.RespondToConsultationRequestAsync(It.Is<ConsultationRequestResponse>(y =>
            y.Answer == ConsultationAnswer.Accepted &&
            y.ConferenceId == expectedConferenceId &&
            y.RequestedBy == expectedParticipantId &&
            y.RequestedFor == expectedParticipantId &&
            y.RoomLabel == expectedRoomLabel)), Times.Never);
    }
    
    [Test]
    public async Task JoinPrivateConsultation_VideoApiException_ReturnStatusCode()
    {
        // Arrange
        Guid expectedConferenceId = Guid.NewGuid();
        Guid expectedParticipantId = Guid.NewGuid();
        string expectedRoomLabel = "ExpectedRoomLabel";
        int expectedStatusCode = 503;
        
        Conference conference = new Conference();
        conference.Id = expectedConferenceId;
        conference.Participants.Add(new Participant()
        {
            Id = Guid.NewGuid(),
            Username = ClaimsPrincipalBuilder.Username
        });
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(y => y == expectedConferenceId)))
            .ThrowsAsync(new VideoApiException("message", expectedStatusCode, "response", null, null));
        
        JoinPrivateConsultationRequest request = new JoinPrivateConsultationRequest()
        {
            ConferenceId = expectedConferenceId,
            ParticipantId = expectedParticipantId,
            RoomLabel = expectedRoomLabel
        };
        
        // Act
        var result = await _consultationsController.JoinPrivateConsultation(request);
        
        // Assert
        result.Should().BeAssignableTo<StatusCodeResult>();
        result.As<StatusCodeResult>().StatusCode.Should().Be(expectedStatusCode);
        
        _mocker.Mock<IConsultationNotifier>().Verify(x => x.NotifyParticipantTransferring(
            It.Is<Conference>(c => c == conference),
            It.Is<Guid>(id => id == expectedParticipantId),
            It.Is<string>(room => room == expectedRoomLabel)), Times.Never);
        
        _mocker.Mock<IVideoApiClient>().Verify(x => x.RespondToConsultationRequestAsync(It.Is<ConsultationRequestResponse>(y =>
            y.Answer == ConsultationAnswer.Accepted &&
            y.ConferenceId == expectedConferenceId &&
            y.RequestedBy == expectedParticipantId &&
            y.RequestedFor == expectedParticipantId &&
            y.RoomLabel == expectedRoomLabel)), Times.Never);
    }
}
