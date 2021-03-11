using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Controllers;
using VideoWeb.Mappings;
using VideoApi.Client;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.VirtualRoomController
{
    public class GetInterpreterRoomForParticipantTests
    {
        private AutoMock _mocker;
        private VirtualRoomsController _controller;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            BuildConferenceForTest();
            _mocker = AutoMock.GetLoose();
            
            _mocker.Mock<IConferenceCache>().Setup(cache => cache.GetOrAddConferenceAsync(_testConference.Id, It.IsAny<Func<Task<ConferenceDetailsResponse>>>()))
                .Callback(async (Guid anyGuid, Func<Task<ConferenceDetailsResponse>> factory) => await factory())
                .ReturnsAsync(_testConference);
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<SharedParticipantRoomMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>()
                .Setup(x => x.Get<SharedParticipantRoomResponse, Participant, bool, SharedParticipantRoom>())
                .Returns(_mocker.Create<SharedParticipantRoomMapper>(parameters));
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };
            
            _controller = _mocker.Create<VirtualRoomsController>();
            _controller.ControllerContext = context;
        }

        [Test]
        public async Task should_return_okay_when_room_maps()
        {
            var vmr = new SharedParticipantRoomResponse()
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "pat_join__interpreter",
                PexipNode = "sip.unit.test.com"
            };
            var participantId = _testConference.Participants.First(x=> !x.IsWitness() && !x.IsJudge()).Id;
            var conferenceId = _testConference.Id;
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetInterpreterRoomForParticipantAsync(conferenceId, participantId))
                .ReturnsAsync(vmr);

            var result = await _controller.GetInterpreterRoomForParticipant(conferenceId, participantId);
            result.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().BeAssignableTo<SharedParticipantRoom>();
        }
        
        [Test]
        public async Task should_return_call_get_witness_room_when_participant_type_is_Witness()
        {
            var vmr = new SharedParticipantRoomResponse()
            {
                Label = "Interpreter1",
                ParticipantJoinUri = "pat_join__interpreter",
                PexipNode = "sip.unit.test.com"
            };
            var participantId = _testConference.Participants.First(x=> x.IsWitness()).Id;
            var conferenceId = _testConference.Id;
            var participantType = "Witness";
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetWitnessRoomForParticipantAsync(conferenceId, participantId))
                .ReturnsAsync(vmr);

            var result = await _controller.GetInterpreterRoomForParticipant(conferenceId, participantId, participantType);
            result.Should().BeAssignableTo<OkObjectResult>().Which.Value.Should().BeAssignableTo<SharedParticipantRoom>();
        }

        [Test]
        public async Task should_return_video_api_status_code_when_exception_is_thrown()
        {
            var participantId = Guid.NewGuid();
            var conferenceId = Guid.NewGuid();
            
            var apiException = new VideoApiException<ProblemDetails>("Internal Server Error",
                (int) HttpStatusCode.NotFound,
                "Stacktrace goes here", null, default, null);
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetInterpreterRoomForParticipantAsync(conferenceId, participantId))
                .ThrowsAsync(apiException);
            
            var result = await _controller.GetInterpreterRoomForParticipant(conferenceId, participantId);
            result.Should().BeAssignableTo<ObjectResult>().Which.StatusCode.Should().Be(apiException.StatusCode);
        }
        
        private void BuildConferenceForTest()
        {
            var conference = new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid())
                        .With(x=> x.HearingRole = "Witness").Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                HearingVenueName = "Hearing Venue Test",
            };
            
            _testConference = conference;
        }
    }
}
