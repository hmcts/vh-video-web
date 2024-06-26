using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Faker;
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
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using ParticipantResponse = VideoApi.Contract.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.EndOfDayController;

public class GetActiveConferencesTests
{
    private AutoMock _mocker;
    private VideoWeb.Controllers.EndOfDayController _sut;
    
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

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantDtoForResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantResponseForUserMapper>()
                .AddTypedParameters<ConferenceForHostResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>())
                .Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));

            var controller = _mocker.Create<VideoWeb.Controllers.EndOfDayController>();
            controller.ControllerContext = context;
            return controller;
        }
    
    [Test]
    public async Task should_return_active_conferences()
    {
        // arrange
        var participants = Builder<ParticipantResponse>.CreateListOfSize(4)
            .All()
            .With(x => x.Username = Internet.Email())
            .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
            .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
            .TheRest().With(x => x.UserRole = UserRole.Individual).Build().ToList();
        
        var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(10).All()
            .With(x => x.Participants = participants)
            .With((x, i) => x.CaseName = $"Test case name {i + 1}")
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Status = ConferenceState.NotStarted)
            .With(x => x.ClosedDateTime = null)
            .With(x => x.IsWaitingRoomOpen = true)
            .Random(2).With(x => x.CaseName = "Test case name same")
            .And(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-10))
            .Random(2).With(x => x.CaseName = "Test case name same closed").With(x => x.Status = ConferenceState.Closed)
            .And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-30)).And(x =>
                x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-200))
            .Random(1).With(x => x.Status = ConferenceState.Closed)
            .And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-25)).And(x =>
                x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
            .Random(1).With(x => x.Status = ConferenceState.InSession).And(x =>
                x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
            .Build().ToList();
        
        var allocatedCsoResponses =
            conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId, Cso = new JusticeUserResponse{FullName = $"TestUserFor{conference.HearingRefId}"}}).ToList();
        allocatedCsoResponses.Add(new AllocatedCsoResponse{ HearingId = Guid.NewGuid() }); //add one non existing hearing
        allocatedCsoResponses[0].Cso = null; //on unallocated hearing 
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetActiveConferencesAsync())
            .ReturnsAsync(conferences);
        
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
            .ReturnsAsync(allocatedCsoResponses);
        
        // act
        var result = await _sut.GetActiveConferences();
        
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
            .Setup(x => x.GetActiveConferencesAsync())
            .ThrowsAsync(new VideoApiException("Not found", 404, "Not found", null, null));

        // act
        var result = await _sut.GetActiveConferences();
        
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
            .Setup(x => x.GetActiveConferencesAsync())
            .ThrowsAsync(new VideoApiException("Internal server error", 500, "Internal server error", null, null));
        
        // act
        var result = await _sut.GetActiveConferences();
        
        // assert
        var typedResult = (ObjectResult) result.Result;
        typedResult.Should().NotBeNull();
        typedResult.StatusCode.Should().Be(500);
        typedResult.Value.Should().Be("Internal server error");
    }
    
}
