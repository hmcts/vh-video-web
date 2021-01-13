using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Request;
using VideoWeb.Controllers;
using VideoWeb.Services.Video;
using VideoWeb.UnitTests.Builders;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ConsultationController
{
    public class StartConsultationTest
    {
        private AutoMock _mocker;
        private ConsultationsController _controller;
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


            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(_testConference.Id,
                        It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);

            _controller = _mocker.Create<ConsultationsController>();
            _controller.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_participant_not_found_when_request_is_sent()
        {
            //_mocker.Mock<IVideoApiClient>()
            //    .Setup(x => x.StartConsultationRequestAsync(It.IsAny<StartConsultationRequest>()))
            //    .Returns(Task.FromResult(default(object)));

            var conference = new Conference { Id = Guid.NewGuid() };
            _mocker.Mock<IConferenceCache>().Setup(cache =>
                    cache.GetOrAddConferenceAsync(conference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(conference);

            var consultationRequest = Builder<StartPrivateConsultationRequest>.CreateNew()
                .With(x => x.ConferenceId = conference.Id).Build();
            var result = await _controller.StartConsultationAsync(consultationRequest);

            var typedResult = (NotFoundResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_accepted_when_request_is_sent()
        {
            //_mocker.Mock<IVideoApiClient>()
            //    .Setup(x => x.StartConsultationRequestAsync(It.IsAny<StartConsultationRequest>()))
            //    .Returns(Task.FromResult(default(object)));

            var result =
                await _controller.StartConsultationAsync(
                    ConsultationHelper.GetStartConsultationRequest(_testConference));
            var typedResult = (AcceptedResult)result;
            typedResult.Should().NotBeNull();
        }

        [Test]
        public async Task Should_return_bad_request()
        {
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "{\"ConsultationRoom\":[\"No consultation room available\"]}", null, default, null);
            //_mocker.Mock<IVideoApiClient>()
            //    .Setup(x => x.StartConsultationRequestAsync(It.IsAny<StartConsultationRequest>()))
            //    .ThrowsAsync(apiException);

            var result =
                await _controller.StartConsultationAsync(
                    ConsultationHelper.GetStartConsultationRequest(_testConference));
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }

        [Test]
        public async Task Should_return_exception()
        {
            var apiException = new VideoApiException("Internal Server Error",
                (int)HttpStatusCode.InternalServerError, "The server collapse due to unhandled error", default, null);
            //_mocker.Mock<IVideoApiClient>()
            //    .Setup(x => x.StartConsultationRequestAsync(It.IsAny<StartConsultationRequest>()))
            //    .ThrowsAsync(apiException);

            var result =
                await _controller.StartConsultationAsync(
                    ConsultationHelper.GetStartConsultationRequest(_testConference));
            var typedResult = (ObjectResult)result;
            typedResult.Should().NotBeNull();
        }
    }
}
