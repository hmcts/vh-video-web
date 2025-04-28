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
        _logger.Setup(x => x.IsEnabled(LogLevel.Error)).Returns(true);
        _logger.Setup(x => x.IsEnabled(LogLevel.Warning)).Returns(true);
        _logger.Setup(x => x.IsEnabled(LogLevel.Information)).Returns(true);
        _controller = _mocker.Create<ConferencesController>();
        _controller.ControllerContext = context;
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayV2Async(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConfirmedHearingsTodayResponseV2>());

    }

    [Test]
    public async Task Should_return_ok_with_list_of_conferences()
    {
        var participants = new List<ParticipantCoreResponse>
        {
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual).Build(),
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Representative).Build(),
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Judge).Build(),
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.StaffMember).Build()
        };

        var bookings = Builder<ConfirmedHearingsTodayResponseV2>.CreateListOfSize(10).All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Endpoints = Builder<EndpointResponseV2>.CreateListOfSize(1).Build().ToList())
            .Build().ToList();

        var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(10).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Participants = participants)
            .With(x => x.CurrentStatus = ConferenceState.NotStarted)
            .Build().ToList();

        for (var i = 0; i < bookings.Count; i++)
        {
            conferences[i].HearingId = bookings[i].Id;
        }

        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);

        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayV2Async(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);

        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);

        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();

        var conferencesForUser = (List<ConferenceForHostResponse>)typedResult.Value;
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
        var participants = new List<ParticipantCoreResponse>
        {
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual).Build(),
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Representative).Build(),
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.Judge).Build(),
            Builder<ParticipantCoreResponse>.CreateNew().With(x => x.UserRole = UserRole.StaffMember).Build()

        };

        var bookings = Builder<ConfirmedHearingsTodayResponseV2>.CreateListOfSize(10).All()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Endpoints = Builder<EndpointResponseV2>.CreateListOfSize(1).Build().ToList())
            .Build().ToList();

        var conferences = Builder<ConferenceCoreResponse>.CreateListOfSize(5).All()
            .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
            .With(x => x.ScheduledDuration = 20)
            .With(x => x.Participants = participants)
            .With(x => x.CurrentStatus = ConferenceState.NotStarted)
            .Build().ToList();

        for (var i = 0; i < bookings.Count; i++)
            if (i < conferences.Count)
                conferences[i].HearingId = bookings[i].Id;


        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(conferences);

        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayV2Async(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(bookings);

        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);

        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        _logger.Verify(x => x.Log(LogLevel.Error, It.IsAny<EventId>(), It.IsAny<It.IsAnyType>(), It.IsAny<Exception>(), It.IsAny<Func<It.IsAnyType, Exception, string>>()), Times.Exactly(1));
        var conferencesForUser = (List<ConferenceForHostResponse>)typedResult.Value;
        conferencesForUser.Should().NotBeNullOrEmpty();
        conferencesForUser!.Count.Should().Be(conferences.Count);

        for (var i = 0; i < conferencesForUser.Count; i++)
        {
            var position = i + 1;
            conferencesForUser[i].CaseName.Should().Be($"CaseName{position}");
        }
    }

    [Test]
    public async Task Should_return_empty_list_when_no_hearings_found()
    {
        // Arrange
        _mocker.Mock<IBookingsApiClient>()
            .Setup(x => x.GetConfirmedHearingsByUsernameForTodayV2Async(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConfirmedHearingsTodayResponseV2>());
        _mocker.Mock<IVideoApiClient>()
            .Setup(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<ConferenceCoreResponse>());

        // Act
        var result = await _controller.GetConferencesForHostAsync(CancellationToken.None);

        // Assert
        var typedResult = (OkObjectResult)result.Result;
        typedResult.Should().NotBeNull();
        _mocker.Mock<IVideoApiClient>()
            .Verify(x => x.GetConferencesByHearingRefIdsAsync(It.IsAny<GetConferencesByHearingIdsRequest>(), It.IsAny<CancellationToken>()), Times.Never);
        var conferencesForUser = (List<ConferenceForHostResponse>)typedResult.Value;
        conferencesForUser.Should().BeEmpty();
    }
}
