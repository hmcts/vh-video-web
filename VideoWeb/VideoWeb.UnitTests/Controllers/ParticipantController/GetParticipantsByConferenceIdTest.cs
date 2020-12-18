using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using ProblemDetails = VideoWeb.Services.Video.ProblemDetails;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class GetParticipantsByConferenceIdTest
    {
        private AutoMock _mocker;
        private ParticipantsController _sut;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Conference, IEnumerable<JudgeInHearingResponse>, IEnumerable<ParticipantContactDetailsResponseVho>>()).Returns(_mocker.Create<ParticipantStatusResponseForVhoMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<EventType, string>()).Returns(_mocker.Create<EventTypeReasonMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceEventRequest, Conference, CallbackEvent>()).Returns(_mocker.Create<CallbackEventMapper>());
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<IEnumerable<ParticipantSummaryResponse>, List<ParticipantForUserResponse>>()).Returns(_mocker.Create<ParticipantForUserResponseMapper>());

            _sut = _mocker.Create<ParticipantsController>();
        }

        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = Guid.NewGuid();
            var response = CreateValidParticipantsSummaryResponse();

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetParticipantsByConferenceIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(response);

            var result = await _sut.GetParticipantsByConferenceIdAsync(conferenceId);
            var typedResult = (OkObjectResult)result;
            typedResult.Should().NotBeNull();
            var participants = (List<ParticipantForUserResponse>)typedResult.Value;
            participants.Should().NotBeNull();
            participants.Count.Should().Be(3);
        }

        [Test]
        public async Task Should_throw_exception()
        {
            var conferenceId = Guid.NewGuid();
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                 "Please provide a valid conference Id", null, default, null);

            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetParticipantsByConferenceIdAsync(It.IsAny<Guid>()))
                .Throws(apiException);

            var result = await _sut.GetParticipantsByConferenceIdAsync(conferenceId);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);

        }

        private List<ParticipantSummaryResponse> CreateValidParticipantsSummaryResponse()
        {
            return Builder<ParticipantSummaryResponse>.CreateListOfSize(3).Build().ToList();
        }
    }
}
