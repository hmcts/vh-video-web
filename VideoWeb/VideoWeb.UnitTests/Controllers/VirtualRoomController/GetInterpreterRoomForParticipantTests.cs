using System;
using System.Net;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
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
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.VirtualRoomController
{
    public class GetInterpreterRoomForParticipantTests
    {
        private AutoMock _mocker;
        private VirtualRoomsController _controller;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<SharedParticipantRoomMapper>()
                .Build();

            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<SharedParticipantRoomResponse, Guid, SharedParticipantRoom>())
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
                Label = "Test",
                ParticipantJoinUri = "pat_join__interpreter",
                PexipNode = "sip.unit.test.com"
            };
            var participantId = Guid.NewGuid();
            var conferenceId = Guid.NewGuid();
            
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
                Label = "Test",
                Participant_join_uri = "pat_join__interpreter",
                Pexip_node = "sip.unit.test.com"
            };
            var participantId = Guid.NewGuid();
            var conferenceId = Guid.NewGuid();
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
    }
}
