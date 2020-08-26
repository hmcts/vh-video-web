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
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.Start)
                .FromRoomType(null)
                .ToRoomType(null)
                .Build();

            var response = context.Apis.VideoWebApi.SendCallBackEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }
    }
}
