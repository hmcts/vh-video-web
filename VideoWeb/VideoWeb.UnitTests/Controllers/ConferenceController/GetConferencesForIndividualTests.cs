using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.UnitTests.Builders;
using ConferenceForIndividualResponse = VideoWeb.Contract.Responses.ConferenceForIndividualResponse;

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
        
        var conferencesResponses = Builder<ConferenceCoreResponse>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.IsWaitingRoomOpen = true)
            .Build().ToList();
        
        var conferences = Builder<Conference>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.IsWaitingRoomOpen = true)
            .Build();
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferencesResponses);
        
        
        _mocker.Mock<IConferenceService>()
            .Setup(x => x.GetConferences(It.IsAny<IEnumerable<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);
        
        var result = await _sut.GetConferencesForIndividual(CancellationToken.None);
        
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult?.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser.Count.Should().Be(conferences.Count);
    }
    
    [Test]
    public async Task Should_return_ok_with_list_of_conferences()
    {
        var bookings = Builder<ConfirmedHearingsTodayResponseV2>.CreateListOfSize(10).All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Endpoints = Builder<EndpointResponseV2>.CreateListOfSize(1).Build().ToList())
            .Build().ToList();
        
        var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.IsWaitingRoomOpen = true)
            .Build().ToList();
        
        for (var i = 0; i < bookings.Count; i++)
        {
            conferences[i].HearingId = bookings[i].Id;
        }
        
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesTodayForIndividualByUsernameAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);
        
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayV2Async(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);
        
        var result = await _sut.GetConferencesForIndividual(CancellationToken.None);
        
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        
        var conferencesForUser = (List<ConferenceForIndividualResponse>)typedResult.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser.Count.Should().Be(conferences.Count);
    }
}
