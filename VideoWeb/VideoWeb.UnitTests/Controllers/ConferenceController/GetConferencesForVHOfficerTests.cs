using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
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
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;
using UserRole = VideoWeb.Services.Video.UserRole;

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
                .Setup(x => x.GetConferencesTodayForAdminAsync(It.IsAny<IEnumerable<string>>()))
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
                .TheFirst(1).With(x => x.User_role = UserRole.Judge)
                .TheRest().With(x => x.User_role = UserRole.Individual).Build().ToList();


            var conferences = Builder<ConferenceForAdminResponse>.CreateListOfSize(10).All()
                .With(x => x.Participants = participants)
                .With(x => x.Scheduled_date_time = DateTime.UtcNow.AddMinutes(-60))
                .With(x => x.Scheduled_duration = 20)
                .With(x => x.Status = ConferenceState.NotStarted)
                .With(x => x.Closed_date_time = null)
                .Build().ToList();
            conferences.Last().Status = ConferenceState.InSession;

            var minutes = -60;
            foreach (var conference in conferences)
            {
                conference.Closed_date_time = DateTime.UtcNow.AddMinutes(minutes);
                minutes += 30;
            }

            var closedConferenceTimeLimit = DateTime.UtcNow.AddMinutes(30);
            var expectedConferenceIds = conferences.Where(x =>
                    x.Status != ConferenceState.Closed ||
                    DateTime.Compare(x.Closed_date_time.GetValueOrDefault(), closedConferenceTimeLimit) < 0)
                .Select(x => x.Id).ToList();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferencesTodayForAdminAsync(It.IsAny<IEnumerable<string>>()))
                .ReturnsAsync(conferences);

            var conferenceWithMessages = conferences.First();
            var judge = conferenceWithMessages.Participants.Single(x => x.User_role == UserRole.Judge);
            var messages = new List<InstantMessageResponse>
            {
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 5", Time_stamp = DateTime.UtcNow.AddMinutes(-1)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 4", Time_stamp = DateTime.UtcNow.AddMinutes(-2)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 3", Time_stamp = DateTime.UtcNow.AddMinutes(-4)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 2", Time_stamp = DateTime.UtcNow.AddMinutes(-6)},
                new InstantMessageResponse
                    {From = judge.Username, Message_text = "judge - 1", Time_stamp = DateTime.UtcNow.AddMinutes(-7)},
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
                conference.CaseName.Should().Be($"Case_name{i++}");
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
                .AddTypedParameters<ParticipantForJudgeResponseMapper>()
                .AddTypedParameters<ParticipantResponseForVhoMapper>()
                .AddTypedParameters<ParticipantForUserResponseMapper>()
                .AddTypedParameters<ConferenceForJudgeResponseMapper>()
                .AddTypedParameters<ConferenceForIndividualResponseMapper>()
                .AddTypedParameters<ConferenceForVhOfficerResponseMapper>()
                .AddTypedParameters<ConferenceResponseVhoMapper>()
                .AddTypedParameters<ConferenceResponseMapper>()
                .Build();
            var controller = _mocker.Create<ConferencesController>(parameters);
            controller.ControllerContext = context;
            return controller;
        }

    }
}
