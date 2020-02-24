using System;
using System.Net;
using FluentAssertions;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Helpers;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.AcceptanceTests.Strategies.ParticipantStatus
{
    internal class JoiningStrategy : IParticipantStatusStrategy
    {
        public void Execute(TestContext context, Guid participantId)
        {
            var request = new CallbackEventRequestBuilder()
                .WithConferenceId(context.Test.NewConferenceId)
                .WithParticipantId(participantId)
                .WithEventType(EventType.ParticipantJoining)
                .Build();

            var response = context.Apis.VideoWebApi.SendCallBackEvent(request);
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        }
    }
}
