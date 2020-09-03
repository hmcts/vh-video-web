
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class CallbackEventMapperTests
    {
        [Test]
        public void Should_map_conferenceevent_to_callbackevent()
        {
            var testConference = new Conference
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
                }
            };
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = testConference.Id.ToString())
                .With(x => x.Participant_id = testConference.Participants[0].Id.ToString())
                .With(x => x.Event_type = EventType.Joined)
                .Build();

            var result =
                CallbackEventMapper.MapConferenceEventToCallbackEventModel(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.TransferFrom.Should().Be(conferenceEventRequest.Transfer_from);
            result.TransferTo.Should().Be(conferenceEventRequest.Transfer_to);
        }

        [Test]
        public void should_map_callback_to_endpoint_joined()
        {
            var testConference = new Conference
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
                        .Build()
                },
                Endpoints = Builder<Endpoint>.CreateListOfSize(2).Build().ToList()
            };
            
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = testConference.Id.ToString())
                .With(x => x.Participant_id = testConference.Endpoints[0].Id.ToString())
                .With(x => x.Event_type = EventType.Joined)
                .Build();

            var result =
                CallbackEventMapper.MapConferenceEventToCallbackEventModel(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventType.EndpointJoined);
        }
        
        [Test]
        public void should_map_callback_to_endpoint_disconnected()
        {
            var testConference = new Conference
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
                        .Build()
                },
                Endpoints = Builder<Endpoint>.CreateListOfSize(2).Build().ToList()
            };
            
            var conferenceEventRequest = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Conference_id = testConference.Id.ToString())
                .With(x => x.Participant_id = testConference.Endpoints[0].Id.ToString())
                .With(x => x.Event_type = EventType.Disconnected)
                .Build();

            var result =
                CallbackEventMapper.MapConferenceEventToCallbackEventModel(conferenceEventRequest, testConference);
            result.Should().NotBeNull();
            result.EventType.Should().Be(EventType.EndpointDisconnected);
        }
    }
}
