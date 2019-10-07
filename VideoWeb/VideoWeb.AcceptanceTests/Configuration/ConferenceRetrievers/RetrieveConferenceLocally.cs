using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using FluentAssertions;
using Testing.Common.Helpers;
using VideoWeb.AcceptanceTests.Builders;
using VideoWeb.AcceptanceTests.Contexts;
using VideoWeb.Common.Helpers;
using VideoWeb.Services.Video;

namespace VideoWeb.AcceptanceTests.Configuration.ConferenceRetrievers
{
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

            new ExecuteRequestBuilder()
                .WithContext(context)
                .WithExpectedStatusCode(HttpStatusCode.Created)
                .SendToVideoApi();

            var conference = ApiRequestHelper.DeserialiseSnakeCaseJsonToResponse<ConferenceDetailsResponse>(context.Json);
            conference.Should().NotBeNull();

            return conference;
        }
    }
}
