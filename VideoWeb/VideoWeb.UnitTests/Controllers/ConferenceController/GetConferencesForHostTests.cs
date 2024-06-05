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
using ConferenceVideoApi = VideoApi.Contract.Responses.ConferenceForHostResponse;
using ParticipantVideoApi = VideoApi.Contract.Responses.ParticipantForHostResponse;
using ConferenceForHostResponse = VideoWeb.Contract.Responses.ConferenceForHostResponse;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.V1.Responses;
using Microsoft.Extensions.Logging;
using VideoWeb.Mappings;
using VideoWeb.Contract.Responses;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoWeb.Common.Models;
using EndpointResponse = BookingsApi.Contract.V1.Responses.EndpointResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
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

            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .AddTypedParameters<VideoEndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .AddTypedParameters<BookingForHostResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConfirmedHearingsTodayResponse, List<VideoApi.Contract.Responses.ConferenceForHostResponse>, ConferenceForHostResponse>()).Returns(_mocker.Create<BookingForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceVideoApi, ConferenceForHostResponse>()).Returns(_mocker.Create<ConferenceForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDto, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));
            _logger = _mocker.Mock<ILogger<ConferencesController>>().SetupAllProperties();
            _controller = _mocker.Create<ConferencesController>();
            _controller.ControllerContext = context;
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
                .ReturnsAsync(new List<ConfirmedHearingsTodayResponse>());

        }

        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var bookings = Builder<ConfirmedHearingsTodayResponse>.CreateListOfSize(10).All()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(1).Build().ToList())
                .Build().ToList();
            
            var participants = new List<ParticipantVideoApi>
            {
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.Individual).Build(),
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.Representative).Build(),
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.Judge).Build(),
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.StaffMember).Build()

            };
            var conferences = Builder<ConferenceVideoApi>.CreateListOfSize(10).All()
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.Participants = participants)
                .Build().ToList();

            for (var i = 0; i < bookings.Count; i++)
            {
                conferences[i].HearingId = bookings[i].Id;
            }

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
                .ReturnsAsync(bookings);

            var result = await _controller.GetConferencesForHostAsync();

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
            var bookings = Builder<ConfirmedHearingsTodayResponse>.CreateListOfSize(10).All()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Endpoints = Builder<EndpointResponse>.CreateListOfSize(1).Build().ToList())
                .Build().ToList();
            
            var participants = new List<ParticipantVideoApi>
            {
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.Individual).Build(),
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.Representative).Build(),
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.Judge).Build(),
                Builder<ParticipantVideoApi>.CreateNew().With(x => x.Role = UserRole.StaffMember).Build()

            };
            var conferences = Builder<ConferenceVideoApi>.CreateListOfSize(5).All()
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.Participants = participants)
                .Build().ToList();

            for (var i = 0; i < bookings.Count; i++)
                if(i < conferences.Count)
                    conferences[i].HearingId = bookings[i].Id;
            

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
                .ReturnsAsync(bookings);

            var result = await _controller.GetConferencesForHostAsync();

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
            var conferences = new List<ConferenceVideoApi>();
            var bookingException = new BookingsApiException("User does not have any hearings", (int)HttpStatusCode.NotFound, "Error", null, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetConfirmedHearingsByUsernameForTodayAsync(It.IsAny<string>()))
                .ThrowsAsync(bookingException);

            var result = await _controller.GetConferencesForHostAsync();

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
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForHostAsync();

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
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForHostAsync();

            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.Unauthorized);
        }

        [Test]
        public async Task Should_forward_error_when_video_api_returns_error()
        {
            
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForHostByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForHostAsync();
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

            var result = await _controller.GetConferencesForHostAsync();

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }
    }
}
