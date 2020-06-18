using System;
using System.Net;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    internal class AvailableStrategy : IParticipantStatusStrategy
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Transfer)
                .FromRoomType(RoomType.HearingRoom)
                .Build();

            var response = context.Apis.VideoWebApi.SendCallBackEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }
    }
}
