using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
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
using NUnit.Framework.Legacy;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.UnitTests.Builders;
using LinkedParticipantResponse = VideoApi.Contract.Responses.LinkedParticipantResponse;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using ParticipantResponse = BookingsApi.Contract.V1.Responses.ParticipantResponse;

namespace VideoWeb.UnitTests.Controllers.ConferenceController
{
    public class GetConferencesForVhOfficerTests
    {
        private AutoMock _mocker;
        private ConferencesController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(new List<HearingDetailsResponse>{Mock.Of<HearingDetailsResponse>()});

            var claimsPrincipal = new ClaimsPrincipalBuilder().WithRole(AppRoles.VhOfficerRole).Build();
            _controller = SetupControllerWithClaims(claimsPrincipal);
        }

        [Test]
        public async Task Should_forward_error_when_video_api_returns_error()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
        }
        
        [Test]
        public async Task Should_forward_error_when_bookings_api_returns_error()
        {
            var apiException = new BookingsApiException<ProblemDetails>("Internal Server Error",
                (int)HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueAsync(It.IsAny<List<string>>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (ObjectResult)result.Result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.InternalServerError);
        }


        [Test]
        public async Task Should_return_ok_with_list_of_conferences()
        {
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
                .TheRest().With(x => x.UserRole = UserRole.Individual).Build().ToList();


            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(10).All()
                .With(x => x.Participants = participants)
                .With((x, i) => x.CaseName = $"Test case name {i+1}")
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.ClosedDateTime = null)
                .With(x => x.IsWaitingRoomOpen = true)
                .Random(2).With(x => x.CaseName = "Test case name same").And(x=> x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-10))
                .Random(2).With(x => x.CaseName = "Test case name same closed").With(x => x.Status = ConferenceState.Closed).And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-30)).And(x => x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-200))
                .Random(1).With(x => x.Status = ConferenceState.Closed).And(x => x.ClosedDateTime = DateTime.UtcNow.AddMinutes(-25)).And(x => x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
                .Random(1).With(x=> x.Status = ConferenceState.InSession).And(x => x.ScheduledDateTime = x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-100))
                .Build().ToList();

            var allocatedCsoResponses = 
                conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId, Cso = new JusticeUserResponse{FullName = $"TestUserFor{conference.HearingRefId}"}}).ToList();
            allocatedCsoResponses.Add(new AllocatedCsoResponse{ HearingId = Guid.NewGuid() }); //add one non existing hearing
            allocatedCsoResponses[0].Cso = null; //on unallocated hearing 

            var closedConferenceTimeLimit = DateTime.UtcNow.AddMinutes(30);
            var expectedConferenceIds = conferences.Where(x =>
                    x.Status != ConferenceState.Closed ||
                    DateTime.Compare(x.ClosedDateTime.GetValueOrDefault(), closedConferenceTimeLimit) < 0)
                .Select(x => x.Id).ToList();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
                .ReturnsAsync(allocatedCsoResponses);
            
            var conferenceWithMessages = conferences[0];
            var judge = conferenceWithMessages.Participants.Single(x => x.UserRole == UserRole.Judge);
            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 5", TimeStamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 4", TimeStamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 3", TimeStamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 2", TimeStamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-7)},
            };

            foreach (var conference in conferences)
            {
                _mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                    .ReturnsAsync(new List<InstantMessageResponse>());
            }

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conferenceWithMessages.Id))
                .ReturnsAsync(messages);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForVhOfficerResponse>) typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();
            var returnedIds = conferencesForUser.Select(x => x.Id).ToList();
            returnedIds.Should().Contain(expectedConferenceIds);
            
            
            // paused hearings in sessions cannot chat, no need to get history
            foreach (var conference in conferences.Where(x=> x.Status == ConferenceState.InSession))
            {
                _mocker.Mock<IVideoApiClient>().Verify(x => x.GetInstantMessageHistoryAsync(conference.Id), Times.Never);
            }

            conferencesForUser.TakeLast(3).Select(x => x.Status).ToList().TrueForAll(x => x == ConferenceStatus.Closed)
                .Should().BeTrue();
        }
        
        [TestCase(false)]
        [TestCase(true)]
        public async Task Should_return_ok_with_list_of_conferences_when_querying_by_cso(bool includeUnallocated)
        {
            // Arrange
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
                .TheRest().With(x => x.UserRole = UserRole.Individual).Build().ToList();


            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(10).All()
                .With(x => x.Participants = participants)
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.ClosedDateTime = null)
                .With(x=> x.IsWaitingRoomOpen = true)
                .Build().ToList();

            var allocatedCsoResponses = 
                conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId}).ToList();
            var allocatedCsoIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
            // Allocate to a cso that is not in our list
            allocatedCsoResponses[0].Cso = new JusticeUserResponse { FullName = $"TestUserFor{allocatedCsoResponses[0].HearingId}", Id = Guid.NewGuid() }; 
            int j = 1;
            // Allocate to csos in our list
            foreach (var csoId in allocatedCsoIds)
            {
                allocatedCsoResponses[j].Cso = new JusticeUserResponse { FullName = $"TestUserFor{allocatedCsoResponses[j].HearingId}", Id = csoId };
                j++;
            }

            conferences[^1].Status = ConferenceState.InSession;

            var minutes = -60;
            foreach (var conference in conferences)
            {
                conference.ClosedDateTime = DateTime.UtcNow.AddMinutes(minutes);
                minutes += 30;
            }

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
                .ReturnsAsync(allocatedCsoResponses);
            
            var conferenceWithMessages = conferences[0];
            var judge = conferenceWithMessages.Participants.Single(x => x.UserRole == UserRole.Judge);
            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 5", TimeStamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 4", TimeStamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 3", TimeStamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 2", TimeStamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-7)},
            };

            foreach (var conference in conferences)
            {
                _mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                    .ReturnsAsync(new List<InstantMessageResponse>());
            }

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conferenceWithMessages.Id))
                .ReturnsAsync(messages);
            
            // Act
            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery
            {
                AllocatedCsoIds = allocatedCsoIds,
                IncludeUnallocated = includeUnallocated
            });
            
            // Assert
            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForVhOfficerResponse>) typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();

            var expectedHearingIds = allocatedCsoResponses
                .Where(r => r.Cso != null)
                .Where(r => allocatedCsoIds.Contains(r.Cso.Id))
                .Select(r => r.HearingId)
                .ToList();

            if (includeUnallocated)
            {
                var unallocatedHearings = allocatedCsoResponses.Where(r => r.Cso == null)
                    .ToList();

                expectedHearingIds = expectedHearingIds
                    .Union(unallocatedHearings.Select(h => h.HearingId))
                    .ToList();
            }

            var actualHearingIds = conferencesForUser.Select(c => c.HearingRefId).ToList();
            
            CollectionAssert.AreEquivalent(expectedHearingIds, actualHearingIds);
        }
        
        [Test]
        public async Task Should_return_ok_with_list_of_conferences_when_querying_by_cso_on_unallocated_hearings_only()
        {
            // Arrange
            var participants = Builder<ParticipantSummaryResponse>.CreateListOfSize(4)
                .All()
                .With(x => x.Username = Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                .TheFirst(1).With(x => x.UserRole = UserRole.Judge)
                .TheRest().With(x => x.UserRole = UserRole.Individual).Build().ToList();


            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(10).All()
                .With(x => x.Participants = participants)
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.ClosedDateTime = null)
                .With(x => x.IsWaitingRoomOpen = true)
                .Build().ToList();

            var allocatedCsoResponses = 
                conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId, Cso = new JusticeUserResponse{FullName = $"TestUserFor{conference.HearingRefId}"}}).ToList();
            allocatedCsoResponses.Add(new AllocatedCsoResponse{ HearingId = Guid.NewGuid() }); //add one non existing hearing
            var unallocatedHearing = allocatedCsoResponses[0];
            unallocatedHearing.Cso = null;

            conferences[^1].Status = ConferenceState.InSession;

            var minutes = -60;
            foreach (var conference in conferences)
            {
                conference.ClosedDateTime = DateTime.UtcNow.AddMinutes(minutes);
                minutes += 30;
            }

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
                .ReturnsAsync(allocatedCsoResponses);
            
            var conferenceWithMessages = conferences[0];
            var judge = conferenceWithMessages.Participants.Single(x => x.UserRole == UserRole.Judge);
            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 5", TimeStamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 4", TimeStamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 3", TimeStamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 2", TimeStamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, MessageText = "judge - 1", TimeStamp = DateTime.UtcNow.AddMinutes(-7)},
            };

            foreach (var conference in conferences)
            {
                _mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conference.Id))
                    .ReturnsAsync(new List<InstantMessageResponse>());
            }

            _mocker.Mock<IVideoApiClient>().Setup(x => x.GetInstantMessageHistoryAsync(conferenceWithMessages.Id))
                .ReturnsAsync(messages);
            
            // Act
            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery
            {
                AllocatedCsoIds = new List<Guid>(),
                IncludeUnallocated = true
            });
            
            // Assert
            var typedResult = (OkObjectResult) result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForVhOfficerResponse>) typedResult.Value;
            conferencesForUser.Should().NotBeNullOrEmpty();

            conferencesForUser.Count.Should().Be(1);
            conferencesForUser[0].HearingRefId.Should().Be(unallocatedHearing.HearingId);
        }
        
        [Test]
        public async Task Should_return_ok_with_no_conferences()
        {
            var conferences = new List<ConferenceForAdminResponse>();
            var bookingException = new BookingsApiException("User does not have any hearings", (int)HttpStatusCode.NotFound, "Error", null, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesForAdminByHearingRefIdAsync(It.IsAny<GetConferencesByHearingIdsRequest>()))
                .ReturnsAsync(conferences);
            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetHearingsForTodayByVenueAsync(It.IsAny<List<string>>()))
                .ThrowsAsync(bookingException);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (OkObjectResult)result.Result;
            typedResult.Should().NotBeNull();

            var conferencesForUser = (List<ConferenceForVhOfficerResponse>)typedResult.Value;
            conferencesForUser.Should().BeEmpty();
        }

        private ConferencesController SetupControllerWithClaims(ClaimsPrincipal claimsPrincipal)
        {
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
                .AddTypedParameters<ConferenceForHostResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForHostResponse, VideoWeb.Contract.Responses.ConferenceForHostResponse>()).Returns(_mocker.Create<ConferenceForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, VideoWeb.Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDto, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));

            var controller = _mocker.Create<ConferencesController>();
            controller.ControllerContext = context;
            return controller;
        }

    }
}
