using System;
using System.Net;
using System.Threading;
using FluentAssertions;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Configuration.ConferenceRetrievers
{
    public class RetrieveConferenceFromBus : IConferenceRetriever
    {
        private const int WaitForConferenceToBeCreatedRetries = 10;

        public ConferenceDetailsResponse GetConference(TestContext context)
        {
            new UpdateStatusToCreateConference().Create(context);

            context.Request = context.Get(new VideoApiUriFactory().ConferenceEndpoints.GetConferenceByHearingRefId(context.NewHearingId));
            context.RequestBody = null;

            var conferenceFound = false;
            for (var i = 0; i < WaitForConferenceToBeCreatedRetries; i++)
            {
                new ExecuteRequestBuilder()
                    .WithContext(context)
                    .SendToVideoApiWithoutVerification();

                if (context.Response.StatusCode.Equals(HttpStatusCode.OK))
                {
                    conferenceFound = true;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            conferenceFound.Should().BeTrue("Conference created from the hearing");
            context.Response.Should().NotBeNull();
            var conference = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(context.Json);
            conference.Should().NotBeNull();

            return conference;
        }
    }
}
