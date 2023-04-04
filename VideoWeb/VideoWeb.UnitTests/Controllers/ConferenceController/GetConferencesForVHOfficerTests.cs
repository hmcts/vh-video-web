using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using BookingsApi.Client;
using BookingsApi.Contract.Responses;
using Faker;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
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
                .Setup(x => x.GetConferencesTodayForAdminByHearingVenueNameAsync(It.IsAny<IEnumerable<string>>()))
                .ThrowsAsync(apiException);

            var result = await _controller.GetConferencesForVhOfficerAsync(new VhoConferenceFilterQuery());

            var typedResult = (ObjectResult) result.Result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.InternalServerError);
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
                .With(x => x.ScheduledDateTime = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.ScheduledDuration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.ClosedDateTime = null)
                .Build().ToList();

            var allocatedCsoResponses = 
                conferences.Select(conference => new AllocatedCsoResponse { HearingId = conference.HearingRefId, Cso = new JusticeUserResponse{FullName = $"TestUserFor{conference.HearingRefId}"}}).ToList();
            allocatedCsoResponses.Add(new AllocatedCsoResponse{ HearingId = Guid.NewGuid() }); //add one non existing hearing
            allocatedCsoResponses.First().Cso = null; //on unallocated hearing 
            
            conferences.Last().Status = ConferenceState.InSession;

            var minutes = -60;
            foreach (var conference in conferences)
            {
                conference.ClosedDateTime = DateTime.UtcNow.AddMinutes(minutes);
                minutes += 30;
            }

            var closedConferenceTimeLimit = DateTime.UtcNow.AddMinutes(30);
            var expectedConferenceIds = conferences.Where(x =>
                    x.Status != ConferenceState.Closed ||
                    DateTime.Compare(x.ClosedDateTime.GetValueOrDefault(), closedConferenceTimeLimit) < 0)
                .Select(x => x.Id).ToList();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForAdminByHearingVenueNameAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(conferences);

            _mocker.Mock<IBookingsApiClient>()
                .Setup(x => x.GetAllocationsForHearingsAsync(It.IsAny<IEnumerable<Guid>>()))
                .ReturnsAsync(allocatedCsoResponses);
            
            var conferenceWithMessages = conferences.First();
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
            var i = 1;
            foreach (var conference in conferencesForUser)
            {
                conference.CaseName.Should().Be($"CaseName{i++}");
            }

            // paused hearings in sessions cannot chat, no need to get history
            _mocker.Mock<IVideoApiClient>().Verify(x => x.GetInstantMessageHistoryAsync(conferences.Last().Id), Times.Never);
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
                .AddTypedParameters<EndpointsResponseMapper>()
                .AddTypedParameters<ParticipantForHostResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .AddTypedParameters<ConferenceForHostResponseMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForHostResponse, VideoWeb.Contract.Responses.ConferenceForHostResponse>()).Returns(_mocker.Create<ConferenceForHostResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<VideoApi.Contract.Responses.ConferenceForIndividualResponse, VideoWeb.Contract.Responses.ConferenceForIndividualResponse>()).Returns(_mocker.Create<ConferenceForIndividualResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceForAdminResponse, AllocatedCsoResponse, ConferenceForVhOfficerResponse>()).Returns(_mocker.Create<ConferenceForVhOfficerResponseMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponseVho>()).Returns(_mocker.Create<ConferenceResponseVhoMapper>(parameters));
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceDetailsResponse, ConferenceResponse>()).Returns(_mocker.Create<ConferenceResponseMapper>(parameters));

            var controller = _mocker.Create<ConferencesController>();
            controller.ControllerContext = context;
            return controller;
        }

    }
}
