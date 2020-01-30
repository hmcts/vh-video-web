using System;
using System.Net;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.HearingStatus
{
    internal class InSessionStrategy : IHearingStatusStrategies
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var transferRequest = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Transfer)
                .FromRoomType(RoomType.WaitingRoom)
                .ToRoomType(RoomType.HearingRoom)
                .Build();

            var transferResponse = context.Apis.VideoWebApi.SendCallBackEvent(transferRequest);
            transferResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

            var joinedRequest = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Joined)
                .FromRoomType(null)
                .ToRoomType(null)
                .Build();

            var joinedResponse = context.Apis.VideoWebApi.SendCallBackEvent(joinedRequest);
            joinedResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }
    }
}