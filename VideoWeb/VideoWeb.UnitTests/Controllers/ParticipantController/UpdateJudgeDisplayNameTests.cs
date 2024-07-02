using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using Autofac.Extras.Moq;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;
using VideoApi.Contract.Requests;
using VideoWeb.Common;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.Controllers.ParticipantController
{
    public class UpdateJudgeDisplayNameTests
    {
        private AutoMock _mocker;
        private ParticipantsController _sut;
        private Conference _testConference;

        [SetUp]
        public void Setup()
        {
            _mocker = AutoMock.GetLoose();
            
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantDtoForResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<Participant, ParticipantResponse>()).Returns(_mocker.Create<ParticipantDtoForResponseMapper>(parameters));
            
            var eventHandlerMock = _mocker.Mock<IEventHandler>();
            _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(eventHandlerMock.Object);
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();

            var eventComponentHelper = new EventComponentHelper();
            _testConference = eventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;

            var context = new ControllerContext { HttpContext = new DefaultHttpContext { User = claimsPrincipal } };

            _sut = _mocker.Create<ParticipantsController>();
            _sut.ControllerContext = context;
        }

        [Test]
        public async Task Should_return_ok()
        {
            var conferenceId = _testConference.Id;
            var participantId = Guid.NewGuid();
            var request = new UpdateParticipantDisplayNameRequest { DisplayName = "contactEmail"};
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.UpdateParticipantDetailsAsync(conferenceId, It.IsAny<Guid>(),
                    It.Is<UpdateParticipantRequest>(participantRequest => request.DisplayName == participantRequest.DisplayName)))
                .Returns(Task.FromResult(default(object)));
            
            _mocker.Mock<IConferenceService>()
                .Setup(x => x.ForceGetConference(conferenceId))
                .ReturnsAsync(new Conference()
                {
                    Id = conferenceId,
                    Participants =
                    [
                        new()
                        {
                            Id = participantId,
                            Username = "username",
                            DisplayName = "newDisplayName",
                            ContactEmail = "contactEmail",
                            LinkedParticipants = null,
                            FirstName = "FirstName",
                            LastName = "LastName",
                            Role = Role.Judge,
                            ParticipantStatus = ParticipantStatus.Available,
                            Representee = "Representee",
                            HearingRole = "HearingRole"
                        }
                    ]
                });

            var result = await _sut.UpdateParticipantDisplayNameAsync(conferenceId, participantId, request);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IConferenceService>().Verify(x => x.ForceGetConference(conferenceId), Times.Once);
            _mocker.Mock<IVideoApiClient>().Verify(x => x.UpdateParticipantDetailsAsync(conferenceId, participantId, It.IsAny<UpdateParticipantRequest>()), Times.Once);
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            
        }

        [Test]
        public async Task Should_throw_error_when_get_api_throws_error()
        {

            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantDisplayNameRequest
            {
                DisplayName = "Sir Steve",
            };
            var apiException = new VideoApiException<ProblemDetails>("Bad Request", (int)HttpStatusCode.BadRequest,
                "Please provide a valid conference Id and participant Id", null, default, null);
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.UpdateParticipantDetailsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<UpdateParticipantRequest>()))
                .Throws(apiException);

            var result = await _sut.UpdateParticipantDisplayNameAsync(conferenceId, Guid.NewGuid(), request);
            var typedResult = (ObjectResult)result;
            typedResult.StatusCode.Should().Be((int)HttpStatusCode.BadRequest);
        }
    }
}
