using System;
using System.Collections.Generic;
using System.Linq;
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
using Endpoint = VideoWeb.Common.Models.Endpoint;

namespace VideoWeb.UnitTests.Controllers.VideoEventController
{
    public abstract class BaseSendHearingEventTests
    {
        protected VideoEventsController Sut;
        protected Conference TestConference;
        protected AutoMock Mocker;
        
        protected Conference BuildConferenceForTest()
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
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<Endpoint>
                {
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .Build(),
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .Build()
                },
                HearingVenueName = "Hearing Venue Test",
                CivilianRooms = new List<CivilianRoom>
                {
                    new CivilianRoom {Id = 1, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
                }
            };
            
            
            conference.CivilianRooms[0].Participants.Add(conference.Participants[1].Id);
            conference.CivilianRooms[0].Participants.Add(conference.Participants[2].Id);

            return conference;
        }
        
        protected ConferenceEventRequest CreateRequest(string phone = null)
        {
            return Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.ConferenceId = TestConference.Id.ToString())
                .With(x => x.ParticipantId = TestConference.Participants[0].Id.ToString())
                .With(x => x.EventType = EventType.Joined)
                .With(x => x.Phone = phone)
                .With(x => x.ParticipantRoomId = null)
                .Build();
        }
        protected ConferenceDetailsResponse CreateValidConferenceResponse(string username = "john@hmcts.net")
        {
            var participants = Builder<ParticipantResponse>.CreateListOfSize(2).Build().ToList();
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

            TestConference = BuildConferenceForTest();
            
            var claimsPrincipal = new ClaimsPrincipalBuilder().Build();
            var context = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = claimsPrincipal
                }
            };

            Sut = Mocker.Create<VideoEventsController>();
            Sut.ControllerContext = context;

            var conference = CreateValidConferenceResponse(null);
            Mocker.Mock<IVideoApiClient>()
                .Setup(x => x.GetConferenceDetailsByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(conference);
            Mocker.Mock<IConferenceService>().Setup(c => c.GetConference(TestConference.Id))
                .ReturnsAsync(TestConference);
            Mocker.Mock<IConferenceCache>().Setup(cache => cache.UpdateConferenceAsync(It.IsAny<Conference>()))
                .Callback<Conference>(updatedConference => { TestConference = updatedConference; });
            Mocker.Mock<IEventHandlerFactory>().Setup(x => x.Get(It.IsAny<EventHub.Enums.EventType>())).Returns(Mocker.Mock<IEventHandler>().Object);
        }
    }
}
