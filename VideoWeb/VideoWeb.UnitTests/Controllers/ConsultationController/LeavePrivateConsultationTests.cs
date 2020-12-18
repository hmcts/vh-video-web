using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoWeb.Mappings.Requests;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class LeavePrivateConsultationTests
    {
        private AutoMock _mocker;
        private ConsultationsController _sut;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            _testConference = ConsultationHelper.BuildConferenceForTest();

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<PrivateConsultationRequest, ConsultationRequest>()).Returns(_mocker.Create<PrivateConsultationRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Dictionary<string, string[]>, BadRequestModelResponse>()).Returns(_mocker.Create<BadRequestResponseMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<LeavePrivateConsultationRequest, LeaveConsultationRequest>()).Returns(_mocker.Create<LeavePrivateConsultationRequestMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<PrivateAdminConsultationRequest, AdminConsultationRequest>()).Returns(_mocker.Create<PrivateAdminConsultationRequestMapper>());

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            _sut = _mocker.Create<ConsultationsController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_participant_not_found_when_request_is_sent()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = new Conference {Id = Guid.NewGuid()};

            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var leaveConsultationRequest = Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var result = await _sut.LeavePrivateConsultationAsync(leaveConsultationRequest);

            var typedResult = (NotFoundResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_no_content_when_request_is_sent()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));

            var leaveConsultationRequest = ConsultationHelper.GetLeaveConsultationRequest(_testConference);
            var result = await _sut.LeavePrivateConsultationAsync(leaveConsultationRequest);

            var typedResult = (NoContentResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int) HttpStatusCode.BadRequest,
                "Please provide a valid conference Id", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result =
                await _sut.LeavePrivateConsultationAsync(
                    ConsultationHelper.GetLeaveConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.StatusCode.Should().Be((int) HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.InternalServerError,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .ThrowsAsync(apiException);

            var result =
                await _sut.LeavePrivateConsultationAsync(
                    ConsultationHelper.GetLeaveConsultationRequest(_testConference));
            var typedResult = (ObjectResult) result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public void Should_throw_InvalidOperationException_two_participants_requested_found()
        {
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.LeavePrivateConsultationAsync(It.IsAny<LeaveConsultationRequest>()))
                .Returns(Task.FromResult(default(object)));
            var conference = _testConference;

            var leaveConsultationRequest = Builder<LeavePrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var findId = leaveConsultationRequest.ParticipantId;
            conference.Participants[0].Id = findId;
            conference.Participants[1].Id = findId;

            Assert.ThrowsAsync<InvalidOperationException>(() =>
                _sut.LeavePrivateConsultationAsync(leaveConsultationRequest));

        }
    }
}
