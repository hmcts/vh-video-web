using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;
using ParticipantResponse = BookingsApi.Contract.V1.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController;

public class GetConferencesForHostTests
{
    private AutoMock _mocker;
    private ConferencesController _controller;
    private Mock<ILogger<ConferencesController>> _logger;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole("Judge").Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };
        
        _logger = _mocker.Mock<ILogger<ConferencesController>>().SetupAllProperties();
        _controller = _mocker.Create<ConferencesController>();
        _controller.ControllerContext = context;
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConfirmedHearingsTodayResponse>());
        
    }
    
    [Test]
    public async Task Should_return_ok_with_list_of_conferences()
    {
        var participants = new List<ParticipantResponse>
        {
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.Individual.ToString()).Build(),
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.Representative.ToString()).Build(),
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.Judge.ToString()).Build(),
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.StaffMember.ToString()).Build()
            
        };
        
        var bookings = Builder<ConfirmedHearingsTodayResponse>.CreateListOfSize(10).All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Participants = participants)
            .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(1).Build().ToList())
            .Build().ToList();
        

        var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.CurrentStatus = ConferenceState.NotStarted)
            .Build().ToList();
        
        for (var i = 0; i < bookings.Count; i++)
        {
            conferences[i].HearingId = bookings[i].Id;
        }
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);
        
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        
        var typedResult = (OkObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForHostResponse>) typedResult.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser!.Count.Should().Be(conferences.Count);
        
        for (var i = 0; i < conferencesForUser.Count; i++)
        {
            var position = i + 1;
            conferencesForUser[i].CaseName.Should().Be($"CaseName{position}");
        }
    }
    
    
    [Test]
    public async Task Should_return_ok_with_list_of_conferences_where_hearings_and_conferences_match_and_log_error_for_difference()
    {
        var participants = new List<ParticipantResponse>
        {
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.Individual.ToString()).Build(),
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.Representative.ToString()).Build(),
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.Judge.ToString()).Build(),
            Builder<ParticipantResponse>.CreateNew().With(x => x.UserRoleName = UserRole.StaffMember.ToString()).Build()
            
        };
        
        var bookings = Builder<ConfirmedHearingsTodayResponse>.CreateListOfSize(10).All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Participants = participants)
            .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(1).Build().ToList())
            .Build().ToList();
        
        var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(5).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.CurrentStatus = ConferenceState.NotStarted)
            .Build().ToList();
        
        for (var i = 0; i < bookings.Count; i++)
            if(i < conferences.Count)
                conferences[i].HearingId = bookings[i].Id;
        
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);
        
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        
        var typedResult = (OkObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        _logger.Verify(x => x.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.Exactly(1));
        var conferencesForUser = (List<ConferenceForHostResponse>) typedResult.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser!.Count.Should().Be(conferences.Count);
        
        for (var i = 0; i < conferencesForUser.Count; i++)
        {
            var position = i + 1;
            conferencesForUser[i].CaseName.Should().Be($"CaseName{position}");
        }
    }
    
    [Test]
    public async Task Should_return_ok_with_no_conferences()
    {
        var conferences = new List<ConferenceCoreResponse>();
        var bookingException = new BookingsApiException("User does not have any hearings", (int)HttpStatusCode.NotFound, "Error", null, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(bookingException);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        
        var typedResult = (OkObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForHostResponse>) typedResult.Value;
        conferencesForUser.Should().BeEmpty();
    }
    
    [Test]
    public async Task Should_return_bad_request()
    {
        var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
            "Please provide a valid email", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        
        var typedResult = (ObjectResult) result.Result;
        typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
    }
    
    [Test]
    public async Task Should_return_forbidden_request()
    {
        var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token",
            (int) HttpStatusCode.Unauthorized,
            "Invalid Client ID", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        
        var typedResult = (ObjectResult) result.Result;
        typedResult?.StatusCode.Should().Be((int) HttpStatusCode.Unauthorized);
    }
    
    [Test]
    public async Task Should_forward_error_when_video_api_returns_error()
    {
        var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
            (int) HttpStatusCode.InternalServerError,
            "Stacktrace goes here", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        var typedResult = result.Value;
        typedResult.Should().BeNull();
    }
    
    [Test]
    public async Task Should_forward_error_when_bookings_api_returns_error()
    {
        var apiException = new BookingsApiException<ProblemDetails>("Internal Server Error",
            (int)HttpStatusCode.InternalServerError,
            "Stacktrace goes here", null, default, null);
        
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(apiException);
        
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);
        
        var typedResult = (ObjectResult)result.Result;
        typedResult?.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
    }
}
