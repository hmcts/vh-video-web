using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Controllers;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using ConferenceVideoApi = VideoApi.Contract.Responses.ConferenceForIndividualResponse;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Contract.Responses;

namespace VideoWeb.UnitTests.Controllers.ConferenceController;

public class GetConferencesForIndividualTests
{
    private AutoMock _mocker;
    private ConferencesController _sut;
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        
        var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
        var context = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = claimsPrincipal
            }
        };

        _sut = _mocker.Create<ConferencesController>();
        _sut.ControllerContext = context;
    }
    
    [Test]
    public async Task Should_return_ok_with_list_of_conferences_for_quickLink_user()
    {
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.QuickLinkParticipant).Build();
        var context = new ControllerContext { HttpContext = new DefaultHttpContext { User = claimsPrincipal } };
        
        _sut = _mocker.Create<ConferencesController>();
        _sut.ControllerContext = context;
        
        var conferences = Builder<ConferenceVideoApi>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.IsWaitingRoomOpen = true)
            .Build().ToList();
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync(conferences);
        
        var result = await _sut.GetConferencesForIndividual();
        
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser.Count.Should().Be(conferences.Count);
    }
    
    [Test]
    public async Task Should_return_ok_with_list_of_conferences()
    {
        var bookings = Builder<ConfirmedHearingsTodayResponse>.CreateListOfSize(10).All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Endpoints = Builder<BookingsApi.Contract.V1.Responses.EndpointResponse>.CreateListOfSize(1).Build().ToList())
            .Build().ToList();
        
        var conferences = Builder<ConferenceVideoApi>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.IsWaitingRoomOpen = true)
            .Build().ToList();
        
        for (var i = 0; i < bookings.Count; i++)
        {
            conferences[i].HearingId = bookings[i].Id;
        }
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync(conferences);
        
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
            .ReturnsAsync(bookings);
        
        var result = await _sut.GetConferencesForIndividual();
        
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser.Count.Should().Be(conferences.Count);
    }
    
    [Test]
    public async Task Should_return_ok_with_no_conferences()
    {
        var conferences = new List<ConferenceVideoApi>();
        var bookingException = new BookingsApiException("User does not have any hearings", (int)HttpStatusCode.NotFound, "Error", null, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
            .ReturnsAsync(conferences);
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
            .ThrowsAsync(bookingException);
        
        var result = await _sut.GetConferencesForIndividual();
        
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
        conferencesForUser.Should().BeEmpty();
    }
    
    [Test]
    public async Task Should_return_bad_request()
    {
        var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
            "Please provide a valid email", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
            .ThrowsAsync(apiException);
        
        var result = await _sut.GetConferencesForIndividual();
        
        var typedResult = (ObjectResult)result.Result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
    }
    
    [Test]
    public async Task Should_return_forbidden_request()
    {
        var apiException = new VideoApiException<ProblemDetails>("Unauthorised Token", (int)HttpStatusCode.Unauthorized,
            "Invalid Client ID", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
            .ThrowsAsync(apiException);
        
        var result = await _sut.GetConferencesForIndividual();
        
        var typedResult = (ObjectResult)result.Result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.Unauthorized);
    }
    
    [Test]
    public async Task Should_forward_error_when_video_api_returns_error()
    {
        var apiException = new VideoApiException<ProblemDetails>("Internal Server Error", (int)HttpStatusCode.InternalServerError,
            "Stacktrace goes here", null, default, null);
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>()))
            .ThrowsAsync(apiException);
        
        var result = await _sut.GetConferencesForIndividual();
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
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
            .ThrowsAsync(apiException);
        
        var result = await _sut.GetConferencesForIndividual();
        
        var typedResult = (ObjectResult)result.Result;
        typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
    }
}
