using System;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Models;

namespace VideoWeb.AcceptanceTests.Builders
{
    internal class CallbackEventRequestBuilder
    {
        private readonly ISingleObjectBuilder<CallbackEvent> _request;

        public CallbackEventRequestBuilder()
        {
            _request = Builder<CallbackEvent>.CreateNew()
                .With(x => x.EventId = Guid.NewGuid().ToString())
                .With(x => x.TransferFrom = RoomType.WaitingRoom.ToString())
                .With(x => x.TransferTo = RoomType.WaitingRoom.ToString())
                .With(x => x.Reason = "Automated");
        }

        public CallbackEventRequestBuilder WithRoomType(RoomType roomType)
        {
            _request.With(x => x.TransferFrom = roomType.ToString());
            _request.With(x => x.TransferTo = roomType.ToString());
            return this;
        }

        public CallbackEventRequestBuilder FromRoomType(RoomType? roomType)
        {
            _request.With(x => x.TransferFrom = roomType.ToString());
            return this;
        }

        public CallbackEventRequestBuilder ToRoomType(RoomType? roomType)
        {
            _request.With(x => x.TransferTo = roomType.ToString());
            return this;
        }

        public CallbackEventRequestBuilder WithConferenceId(Guid conferenceId)
        {
            _request.With(x => x.ConferenceId = conferenceId);
            return this;
        }

        public CallbackEventRequestBuilder WithParticipantId(Guid? participantId)
        {
            if (participantId == null)
                throw new DataMisalignedException("Participant Id cannot be null");
            _request.With(x => x.ParticipantId = (Guid)participantId);
            return this;
        }

        public CallbackEventRequestBuilder WithEventType(EventType eventType)
        {
            _request.With(x => x.EventType = eventType);
            return this;
        }

        public CallbackEventRequestBuilder WithReason(string reason)
        {
            _request.With(x => x.Reason = reason);
            return this;
        }

        public CallbackEventRequestBuilder WithTimestamp(DateTime time)
        {
            _request.With(x => x.TimeStampUtc = time);
            return this;
        }

        public CallbackEvent Build()
        {
            return _request.Build();
        }
    }
}
