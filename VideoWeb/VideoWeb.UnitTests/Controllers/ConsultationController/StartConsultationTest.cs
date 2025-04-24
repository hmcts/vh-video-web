using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Moq;
using NUnit.Framework;
using System;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Hub;
using VideoWeb.EventHub.Models;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Contract.Enums;
using VideoWeb.EventHub.Services;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.ConsultationController;

public class StartConsultationTest
{
    private AutoMock _mocker;
    private ConsultationsController _controller;
    private Conference _testConference;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.JudicialOfficeHolderRole).Build();
        
        _testConference = ConsultationHelper.BuildConferenceForTest();
        
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(y => y == _testConference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(_testConference);
        _mocker.Mock<IHubClients<IEventHubClient>>().Setup(x => x.Group(It.IsAny<string>()))
            .Returns(_mocker.Mock<IEventHubClient>().Object);
        _mocker.Mock<IHubContext<EventHub.Hub.EventHub, IEventHubClient>>().Setup(x => x.Clients)
            .Returns(_mocker.Mock<IHubClients<IEventHubClient>>().Object);
        
        _controller = _mocker.Create<ConsultationsController>();
        _controller.ControllerContext = context;
    }
    
    [Test]
    public async Task Should_return_participant_not_found_when_request_is_sent()
    {
        var conference = new Conference {Id = Guid.NewGuid()};
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConference(It.Is<Guid>(y => y == conference.Id), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conference);
        
        var consultationRequest = Builder<StartPrivateConsultationRequest>.CreateNew()
            .With(x => x.ConferenceId = conference.Id).Build();
        var result = await _controller.StartConsultationAsync(consultationRequest, CancellationToken.None);
        
        var typedResult = (NotFoundResult) result;
        typedResult.Should().NotBeNull();
    }
    
    [Test]
    public async Task Should_return_accepted_when_request_is_sent()
    {
        // Arrange
        var request = ConsultationHelper.GetStartJohConsultationRequest(_testConference);
        
        // Act
        var result = await _controller.StartConsultationAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<AcceptedResult>();
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task should_return_bad_request_if_participant_list_contains_an_observer()
    {
        // Arrange
        var request = ConsultationHelper.GetStartJohConsultationRequest(_testConference);
        request.InviteParticipants = [_testConference.Participants.First(x => x.Role == Role.QuickLinkObserver).Id];
        
        // Act
        var result = await _controller.StartConsultationAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<BadRequestObjectResult>().Which.Value.Should()
            .Be(ConsultationsController.ConsultationWithObserversNotAllowedMessage);
    }
    
    [Test]
    public async Task Should_return_accepted_when_request_is_sent_participant_room_type()
    {
        // Arrange
        const string roomLabel = "Room1";
        const bool locked = false;
        
        var request = ConsultationHelper.GetStartParticipantConsultationRequest(_testConference);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RoomResponse {Label = roomLabel, Locked = locked});
        
        // Act
        var result = await _controller.StartConsultationAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<AcceptedResult>();
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        
        _mocker.Mock<IConsultationNotifier>()
            .Verify(
                x => x.NotifyRoomUpdateAsync(_testConference, It.Is<Room>(r =>
                    r.ConferenceId == _testConference.Id && r.Label == "Room1" && !r.Locked)), Times.Once);
        
        _mocker.Mock<IConsultationNotifier>()
            .Verify(
                x => x.NotifyConsultationRequestAsync(_testConference, "Room1", request.RequestedBy,
                    It.IsIn(request.InviteParticipants)), Times.Exactly(request.InviteParticipants.Length));
        
        _testConference.ConsultationRooms.Count.Should().Be(1);
        var consultationRoomInCache = _testConference.ConsultationRooms[0];
        consultationRoomInCache.Label.Should().Be(roomLabel);
        consultationRoomInCache.Locked.Should().Be(locked);
    }
    
    [Test]
    public async Task Should_only_join_first_successful_endpoint()
    {
        // Arrange
        var request = ConsultationHelper.GetStartParticipantConsultationRequest(_testConference);
        request.InviteEndpoints = new[]
        {
            _testConference.Endpoints[0].Id, // Wrong defense advocate username
            _testConference.Endpoints[1].Id, // Valid
            _testConference.Endpoints[2].Id
        }; // Shouldnt try
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RoomResponse {Label = "Room1", Locked = false});
        
        // Act
        var result = await _controller.StartConsultationAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<AcceptedResult>();
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        
        _mocker.Mock<IConsultationNotifier>()
            .Verify(
                x => x.NotifyRoomUpdateAsync(_testConference, It.Is<Room>(r =>
                    r.ConferenceId == _testConference.Id && r.Label == "Room1" && !r.Locked)), Times.Once);
        
        _mocker.Mock<IConsultationNotifier>()
            .Verify(
                x => x.NotifyConsultationRequestAsync(_testConference, "Room1", request.RequestedBy,
                    It.IsIn(request.InviteParticipants)), Times.Exactly(request.InviteParticipants.Length));
        
        _mocker.Mock<IVideoApiClient>()
            .Verify(
                x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(ecr =>
                    request.InviteEndpoints.Contains(ecr.EndpointId) && ecr.ConferenceId == _testConference.Id), It.IsAny<CancellationToken>()), Times.Once);
    }
    
    [Test]
    public async Task Should_only_join_first_successful_endpoint_first_fail()
    {
        // Arrange
        var request = ConsultationHelper.GetStartParticipantConsultationRequest(_testConference);
        request.InviteEndpoints = new[]
        {
            _testConference.Endpoints[0].Id, // Wrong defense advocate username
            _testConference.Endpoints[1].Id, // Valid but mocked to throw
            _testConference.Endpoints[2].Id
        }; // Valid
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RoomResponse {Label = "Room1", Locked = false});
        var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
            "", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(ecr =>
                ecr.EndpointId == request.InviteEndpoints[1] && ecr.ConferenceId == _testConference.Id), It.IsAny<CancellationToken>()))
            .Throws(apiException);
        
        // Act
        var result = await _controller.StartConsultationAsync(request, CancellationToken.None);
        
        // Assert
        result.Should().BeOfType<AcceptedResult>();
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.CreatePrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()), Times.Once);
        
        _mocker.Mock<IConsultationNotifier>()
            .Verify(
                x => x.NotifyRoomUpdateAsync(_testConference, It.Is<Room>(r =>
                    r.ConferenceId == _testConference.Id && r.Label == "Room1" && !r.Locked)), Times.Once);
        
        _mocker.Mock<IConsultationNotifier>()
            .Verify(
                x => x.NotifyConsultationRequestAsync(_testConference, "Room1", request.RequestedBy,
                    It.IsIn(request.InviteParticipants)), Times.Exactly(request.InviteParticipants.Length));
        
        _mocker.Mock<IVideoApiClient>()
            .Verify(
                x => x.JoinEndpointToConsultationAsync(It.Is<EndpointConsultationRequest>(ecr =>
                    request.InviteEndpoints.Contains(ecr.EndpointId) && ecr.ConferenceId == _testConference.Id), It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
    
    [Test]
    public async Task Should_return_bad_request()
    {
        var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
            "{\"ConsultationRoom\":[\"No consultation room available\"]}", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result =
            await _controller.StartConsultationAsync(
                ConsultationHelper.GetStartJohConsultationRequest(_testConference), CancellationToken.None);
        
        var typedResult = (StatusCodeResult) result;
        typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
    }

    [Test]
    public async Task Should_return_forbidden_when_participants_are_screened()
    {
        // arrange
        var individual = _testConference.Participants.Find(x => x.Role == Role.Individual);
        var endpoint = _testConference.Endpoints[0];
        individual.ProtectFrom.Add(endpoint.ExternalReferenceId);
        var rep = _testConference.Participants.Find(x => x.Role == Role.Representative);
        
        var request = new StartPrivateConsultationRequest()
        {
            ConferenceId = _testConference.Id,
            RequestedBy = rep.Id,
            RoomType = VirtualCourtRoomType.Participant,
            InviteEndpoints = [endpoint.Id],
            InviteParticipants = [individual.Id, rep.Id]
        };
        
        // act
        var result = await _controller.StartConsultationAsync(request, CancellationToken.None);
        
        // assert
        result.Should().BeOfType<BadRequestObjectResult>().Which.Value.Should()
            .Be(ConsultationsController.ConsultationHasScreenedParticipantAndEndpointErrorMessage);
        
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }
    
    [Test]
    public async Task Should_return_exception()
    {
        var apiException = new VideoApiException("Internal Server Error",
            (int) HttpStatusCode.InternalServerError, "The server collapse due to unhandled error", default, null);
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result =
            await _controller.StartConsultationAsync(
                ConsultationHelper.GetStartJohConsultationRequest(_testConference), CancellationToken.None);
        var typedResult = (StatusCodeResult) result;
        typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
    }
    
    [TestCase(AppRoles.JudicialOfficeHolderRole, true)]
    [TestCase(AppRoles.JudgeRole, true)]
    [TestCase(AppRoles.StaffMember, true)]
    [TestCase(AppRoles.CitizenRole, false)]
    [TestCase(AppRoles.VhOfficerRole, false)]
    [TestCase(AppRoles.VenueManagementRole, false)]
    [TestCase(AppRoles.RepresentativeRole, false)]
    [TestCase(AppRoles.CaseAdminRole, false)]
    [TestCase(AppRoles.QuickLinkParticipant, false)]
    [TestCase(AppRoles.QuickLinkObserver, false)]
    public async Task
        When_a_user_tries_to_start_judge_joh_consultation_Should_return_correct_response_code_based_on_role(
            string role, bool shouldBeAllowed)
    {
        var controller = GetControllerWithContextForRole(role);
        
        var result =
            await controller.StartConsultationAsync(
                ConsultationHelper.GetStartJohConsultationRequest(_testConference), CancellationToken.None);
        
        // Assert
        int timesCalledExpected;
        if (shouldBeAllowed)
        {
            result.Should().BeOfType<AcceptedResult>();
            timesCalledExpected = 1;
        }
        else
        {
            result.Should().BeOfType<ForbidResult>();
            timesCalledExpected = 0;
        }
        
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.StartPrivateConsultationAsync(It.IsAny<StartConsultationRequest>(), It.IsAny<CancellationToken>()),
                Times.Exactly(timesCalledExpected));
    }
    
    [Test]
    public async Task Updates_Cache_When_JOH_Consultation_Room_Is_Not_Locked()
    {
        var controller = GetControllerWithContextForRole(AppRoles.JudgeRole);
        var request = ConsultationHelper.GetStartJohConsultationRequest(_testConference);
        var expectedKeyName = $"johConsultationRoomLockedStatus_{request.ConferenceId}";
        
        var result =
            await controller.StartConsultationAsync(
                ConsultationHelper.GetStartJohConsultationRequest(_testConference), CancellationToken.None);
        
        result.Should().BeOfType<AcceptedResult>();
        _mocker.Mock<IDistributedJohConsultationRoomLockCache>()
            .Verify(x => x.UpdateJohConsultationRoomLockStatus(true, expectedKeyName, It.IsAny<CancellationToken>()),
                Times.Once);
    }
    
    [Test]
    public async Task Does_Not_Update_Cache_When_JOH_Consultation_Room_Is_Locked()
    {
        var controller = GetControllerWithContextForRole(AppRoles.JudgeRole);
        controller.WaitForLockRoomTime = 1;
        var request = ConsultationHelper.GetStartJohConsultationRequest(_testConference);
        var expectedKeyName = $"johConsultationRoomLockedStatus_{request.ConferenceId}";
        _mocker.Mock<IDistributedJohConsultationRoomLockCache>().Setup(x => x.IsJohRoomLocked(expectedKeyName, It.IsAny<CancellationToken>()))
            .Returns(Task.FromResult(true));
        
        var result =
            await controller.StartConsultationAsync(
                ConsultationHelper.GetStartJohConsultationRequest(_testConference), CancellationToken.None);
        
        result.Should().BeOfType<AcceptedResult>();
        _mocker.Mock<IDistributedJohConsultationRoomLockCache>()
            .Verify(x => x.UpdateJohConsultationRoomLockStatus(true, expectedKeyName, It.IsAny<CancellationToken>()), Times.Never);
    }
    
    [Test]
    public async Task Should_throw_not_authorized_if_user_claims_null()
    {
        var context = new ControllerContext { HttpContext = new DefaultHttpContext() };
        var controller = _mocker.Create<ConsultationsController>();
        controller.ControllerContext = context;
        Func<Task> action = async () => await _controller.StartConsultationAsync(ConsultationHelper.GetStartJohConsultationRequest(_testConference), CancellationToken.None);
        await action.Should().ThrowAsync<UnauthorizedAccessException>();
    }
    
    private ConsultationsController GetControllerWithContextForRole(string role)
    {
        var cp = new ClaimsPrincipalBuilder().WithRole(role).Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = cp
            }
        };
        
        var controller = _mocker.Create<ConsultationsController>();
        controller.ControllerContext = context;
        return controller;
    }
}
