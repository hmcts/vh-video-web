using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Autofac.Extras.Moq;
using FizzWare.NBuilder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using VideoApi.Client;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Requests;
using VideoApi.Contract.Responses;
using VideoWeb.Common;
using VideoWeb.Common.Caching;
using VideoWeb.Common.Models;
using VideoWeb.Controllers;
using VideoWeb.EventHub.Handlers.Core;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.UnitTests.Builders;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public abstract class BaseSendHearingEventTests
    {
        protected VideoEventsController Sut;
        protected ConferenceDto TestConferenceDto;
        protected AutoMock Mocker;
        
        protected ConferenceDto BuildConferenceForTest()
        {
            var conference = new ConferenceDto
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<ParticipantDto>()
                {
                    Builder<ParticipantDto>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<EndpointDto>
                {
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .Build(),
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .Build()
                },
                HearingVenueName = "Hearing Venue Test",
                CivilianRooms = new List<CivilianRoomDto>
                {
                    new CivilianRoomDto {Id = 1, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
                }
            };
            
            
            conference.CivilianRooms[0].Participants.Add(conference.Participants[1].Id);
            conference.CivilianRooms[0].Participants.Add(conference.Participants[2].Id);

            return conference;
        }
        
        protected ConferenceEventRequest CreateRequest(string phone = null)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = TestConferenceDto.Id.ToString())
                .With(x => x.ParticipantId = TestConferenceDto.Participants[0].Id.ToString())
                .With(x => x.EventType = EventType.Joined)
                .With(x => x.Phone = phone)
                .With(x => x.ParticipantRoomId = null)
                .Build();
        }
        protected ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
        {
            var participants = Builder<ParticipantDetailsResponse>.CreateListOfSize(2).Build().ToList();
            if (!string.IsNullOrWhiteSpace(username))
            {
                participants[0].Username = username;
            }

            var conference = Builder<ConferenceDetailsResponse>.CreateNew()
                .With(x => x.Participants = participants)
                .Build();
            return conference;
        }
        protected void SetupTestConferenceAndMocks()
        {
            Mocker = AutoMock.GetLoose();

            TestConferenceDto = BuildConferenceForTest();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            Mocker.Mock<IMapperFactory>().Setup(x => x.Get<ConferenceEventRequest, ConferenceDto, CallbackEvent>()).Returns(Mocker.Create<CallbackEventMapper>());
            Sut = Mocker.Create<VideoEventsController>();
            Sut.ControllerContext = context;

            var conference = CreateValidConferenceResponse(null);
            Mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);
            Mocker.Mock<IConferenceService>().Setup(c => c.GetConference(TestConferenceDto.Id))
                .ReturnsAsync(TestConferenceDto);
            Mocker.Mock<IConferenceCache>().Setup(cache => cache.UpdateConferenceAsync(It.IsAny<ConferenceDto>()))
                .Callback<ConferenceDto>(updatedConference => { TestConferenceDto = updatedConference; });
            Mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHub.Enums.EventType>())).Returns(Mocker.Mock<IEventHandler>().Object);
            Mocker.Mock<IConferenceService>().Setup(x => x.ConferenceCache).Returns(Mocker.Mock<IConferenceCache>().Object);
        }
    }
}
