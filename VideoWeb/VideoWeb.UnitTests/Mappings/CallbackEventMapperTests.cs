
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using Role = VideoWeb.EventHub.Enums.UserRole;

namespace VideoWeb.UnitTests.Mappings
{
    public class CallbackEventMapperTests
    {
        [Test]
        public void should_map_conferenceevent_to_callbackevent()
        {
            var _testConference = new Conference {
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
                .With(x => x.Conference_id = _testConference.Id.ToString())
                .With(x => x.Participant_id = _testConference.Participants[0].Id.ToString())
                .With(x => x.Event_type = EventType.Joined)
                .Build();

            var result = CallbackEventMapper.MapConferenceEventToCallbackEventModel(conferenceEventRequest);
            result.Should().NotBeNull();
            result.TransferFrom.Should().Be(conferenceEventRequest.Transfer_from);
            result.TransferTo.Should().Be(conferenceEventRequest.Transfer_to);
        }
    }
}
