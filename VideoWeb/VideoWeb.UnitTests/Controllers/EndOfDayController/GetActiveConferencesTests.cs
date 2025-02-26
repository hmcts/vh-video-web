using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using Bogus;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.EndOfDayController;

public class GetActiveConferencesTests
{
    private AutoMock _mocker;
    private VideoWeb.Controllers.EndOfDayController _sut;
    private static readonly Faker Faker = new();
    
    [SetUp]
    public void Setup()
    {
        _mocker = AutoMock.GetLoose();
        var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
        _sut = SetupControllerWithClaims(claimsPrincipal);
    }
    
    private VideoWeb.Controllers.EndOfDayController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            var controller = _mocker.Create<VideoWeb.Controllers.EndOfDayController>();
            controller.ControllerContext = context;
            return controller;
        }
    
    [Test]
    public async Task should_return_active_conferences()
    {
        // arrange
        var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(10).All()
            .With((x, i) => x.CaseName = $"Test case name {i + 1}")
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.CurrentStatus = ConferenceState.NotStarted)
            .With(x => x.ClosedDateTime = null)
            .With(x => x.IsWaitingRoomOpen = true)
            .Random(2).With(x => x.CaseName = "Test case name same")
            .And(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-10))
            .Random(2).With(x => x.CaseName = "Test case name same closed").With(x => x.CurrentStatus = ConferenceState.Closed)
            .And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-30)).And(x =>
                x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-200))
            .Random(1).With(x => x.CurrentStatus = ConferenceState.Closed)
            .And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-25)).And(x =>
                x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
            .Random(1).With(x => x.CurrentStatus = ConferenceState.InSession).And(x =>
                x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
            .Build().ToList();
        
        var allocatedCsoResponses =
            conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingId, Cso = new JusticeUserResponse{FullName = $"TestUserFor{conference.HearingId}"}}).ToList();
        allocatedCsoResponses.Add(new AllocatedCsoResponse{ HearingId = Guid.NewGuid() }); //add one non existing hearing
        allocatedCsoResponses[0].Cso = null; //on unallocated hearing 
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetActiveConferencesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);
        
        // act
        var result = await _sut.GetActiveConferences(CancellationToken.None);
        
        // assert
        var typedResult = (OkObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        typedResult.StatusCode.Should().Be(200);
    }

    [Test]
    public async Task should_return_empty_list_when_api_returns_404()
    {
        // arrange
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetActiveConferencesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new VideoApiException("Not found", 404, "Not found", null, null));

        // act
        var result = await _sut.GetActiveConferences(CancellationToken.None);
        
        // assert
        var typedResult = (OkObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        typedResult.StatusCode.Should().Be(200);
        typedResult.Value.Should().BeOfType<List<ConferenceForVhOfficerResponse>>().Which.Should().BeEmpty();
    }
    
    [Test]
    public async Task should_return_error_when_api_throws_exception()
    {
        // arrange
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetActiveConferencesAsync(It.IsAny<CancellationToken>()))
            .ThrowsAsync(new VideoApiException("Internal server error", 500, "Internal server error", null, null));
        
        // act
        var result = await _sut.GetActiveConferences(CancellationToken.None);
        
        // assert
        var typedResult = (ObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        typedResult.StatusCode.Should().Be(500);
        typedResult.Value.Should().Be("Internal server error");
    }
}
