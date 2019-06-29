using System;
using FizzWare.NBuilder;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class CreateEventRequestBuilder
    {
        private readonly ISingleObjectBuilder<ConferenceEventRequest> _request;

        public CreateEventRequestBuilder()
        {
            _request = Builder<ConferenceEventRequest>.CreateNew()
                .With(x => x.Event_id = Guid.NewGuid().ToString())
                .With(x => x.Transfer_from = RoomType.WaitingRoom)
                .With(x => x.Transfer_to = RoomType.WaitingRoom)
                .With(x => x.Reason = "Automated");
        }

        public CreateEventRequestBuilder WithRoomType(RoomType roomType)
        {
            _request.With(x => x.Transfer_from = RoomType.WaitingRoom);
            _request.With(x => x.Transfer_to = RoomType.WaitingRoom);
            return this;
        }

        public CreateEventRequestBuilder FromRoomType(RoomType roomType)
        {
            _request.With(x => x.Transfer_from = roomType);
            return this;
        }

        public CreateEventRequestBuilder ToRoomType(RoomType roomType)
        {
            _request.With(x => x.Transfer_to = roomType);
            return this;
        }

        public CreateEventRequestBuilder WithConferenceId(Guid? conferenceId)
        {
            _request.With(x => x.Conference_id = conferenceId.ToString());
            return this;
        }

        public CreateEventRequestBuilder WithParticipantId(string participantId)
        {
            _request.With(x => x.Participant_id = participantId);
            return this;
        }

        public CreateEventRequestBuilder WithEventType(EventType eventType)
        {
            _request.With(x => x.Event_type = eventType);
            return this;
        }

        public ConferenceEventRequest Build()
        {
            return _request.Build();
        }
    }
}
