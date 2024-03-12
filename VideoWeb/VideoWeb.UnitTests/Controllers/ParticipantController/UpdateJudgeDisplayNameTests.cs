using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Net;
using System.Threading.Tasks;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoApi.Client;
using VideoWeb.UnitTests.Builders;
using EventHubEventType = VideoWeb.EventHub.Enums.EventType;
using Autofac.Extras.Moq;
using VideoApi.Contract.Enums;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Caching;
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
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<UpdateParticipantDisplayNameRequest, UpdateParticipantRequest>()).Returns(_mocker.Create<UpdateParticipantRequestMapper>());
            
            var parameters = new ParameterBuilder(_mocker)
                .AddTypedParameters<ParticipantResponseMapper>()
                .Build();
            
            _mocker.Mock<IMapperFactory>().Setup(x => x.Get<ParticipantDetailsResponse, ParticipantResponse>()).Returns(_mocker.Create<ParticipantResponseMapper>(parameters));
            
            _mocker.Mock<IConferenceCache>().Setup(x => x.UpdateConferenceAsync(It.IsAny<Conference>())).Returns(Task.CompletedTask);
            
            var eventHandlerMock = _mocker.Mock<IEventHandler>();
            _mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHubEventType>())).Returns(eventHandlerMock.Object);
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();

            var eventComponentHelper = new EventComponentHelper();
            _testConference = eventComponentHelper.BuildConferenceForTest();
            _testConference.Participants[0].Username = ClaimsPrincipalBuilder.Username;

            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

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
                    It.Is<UpdateParticipantRequest>(participantRequest =>
                        request.Fullname == participantRequest.Fullname &&
                        request.DisplayName == participantRequest.DisplayName)))
                .Returns(Task.FromResult(default(object)));
            
            _mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(conferenceId))
                .ReturnsAsync(new ConferenceDetailsResponse
                {
                    Id = conferenceId,
                    Participants = new List<ParticipantDetailsResponse>
                    {
                        new ()
                        {
                            Id = participantId,
                            Username = "username",
                            DisplayName = "newDisplayName",
                            ContactEmail = "contactEmail",
                            CurrentRoom = new RoomResponse(),
                            LinkedParticipants = null,
                            FirstName = "FirstName",
                            LastName = "LastName",
                            UserRole = UserRole.Judge,
                            CurrentStatus = ParticipantState.Available,
                            CaseTypeGroup = "CaseGroup",
                            Representee = "Representee",
                            HearingRole = "HearingRole"
                        }
                    }
                });

            var result = await _sut.UpdateParticipantDisplayNameAsync(conferenceId, participantId, request);
            var typedResult = (NoContentResult)result;
            typedResult.Should().NotBeNull();
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.GetConferenceDetailsByIdAsync(conferenceId), Times.Once);
            _mocker.Mock<IVideoApiClient>()
                .Verify(x => x.UpdateParticipantDetailsAsync(conferenceId, participantId, It.IsAny<UpdateParticipantRequest>()), Times.Once);
            _mocker.Mock<IEventHandler>().Verify(x => x.HandleAsync(It.IsAny<CallbackEvent>()), Times.Once);
            _mocker.Mock<IConferenceCache>().Verify(x => x.UpdateConferenceAsync(It.IsAny<Conference>()), Times.Once);
            
        }

        [Test]
        public async Task Should_throw_error_when_get_api_throws_error()
        {

            var conferenceId = _testConference.Id;
            var request = new UpdateParticipantDisplayNameRequest
            {
                Fullname = "Judge Stive Adams",
                DisplayName = "Sir Steve",
                Representee = ""
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
