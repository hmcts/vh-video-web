using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using FluentAssertions;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Services.Video.UserRole;

namespace VideoWeb.AcceptanceTests.Configuration
{
    public interface IConferenceRetriever
    {
        ConferenceDetailsResponse GetConference(TestContext context);
    }

    public class RetrieveConferenceLocally : IConferenceRetriever
    {
        public ConferenceDetailsResponse GetConference(TestContext context)
        {
            var participants = new List<ParticipantRequest>();
            foreach (var p in context.Hearing.Participants)
            {
                Enum.TryParse(p.User_role_name, out UserRole role);
                var participantsRequest =
                    new VideoWeb.Services.Video.ParticipantRequest
                    {
                        Participant_ref_id = p.Id,
                        Name = p.Title + " " + p.First_name + " " + p.Last_name,
                        Display_name = p.Display_name,
                        Username = p.Username,
                        User_role = (UserRole?)role,
                        Case_type_group = p.Case_role_name,
                        Representee = p.Representee
                    };
                participants.Add(participantsRequest);
            }                 

            var request = new BookNewConferenceRequest
            {
                Hearing_ref_id = context.Hearing.Id,
                Case_type = context.Hearing.Case_type_name,
                Scheduled_date_time = context.Hearing.Scheduled_date_time,
                Scheduled_duration = context.Hearing.Scheduled_duration,
                Case_number = context.Hearing.Cases.First().Number,
                Case_name = context.Hearing.Cases.First().Name,
                Participants = participants
            };

            context.Request = context.Post(new VideoApiUriFactory().ConferenceEndpoints.BookNewConference, request);
            context.Response = context.VideoApiClient().Execute(context.Request);
            context.Json = context.Response.Content;
            context.Response.StatusCode.Should().Be(HttpStatusCode.Created);
            var conference = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(context.Json);
            conference.Should().NotBeNull();

            return conference;
        }
    }

    public class RetrieveConferenceFromBus : IConferenceRetriever
    {
        public ConferenceDetailsResponse GetConference(TestContext context)
        {
            const int waitForConferenceToBeCreatedRetries = 10;
            context.Request = context.Get(new VideoApiUriFactory().ConferenceEndpoints.GetConferenceByHearingRefId(context.NewHearingId));
            context.RequestBody = null;
            var conferenceFound = false;
            for (var i = 0; i < waitForConferenceToBeCreatedRetries; i++)
            {
                context.Response = context.VideoApiClient().Execute(context.Request);
                if (context.Response.Content != null)
                    context.Json = context.Response.Content;
                if (context.Response.StatusCode.Equals(HttpStatusCode.OK))
                {
                    conferenceFound = true;
                    break;
                }
                Thread.Sleep(TimeSpan.FromSeconds(1));
            }

            conferenceFound.Should().BeTrue();
            context.Response.Should().NotBeNull();
            var conference = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(context.Json);
            conference.Should().NotBeNull();

            return conference;
        }
    }

}
