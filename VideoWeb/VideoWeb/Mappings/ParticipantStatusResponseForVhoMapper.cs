using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Services.Video;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;
using BookingParticipant = VideoWeb.Services.Bookings.ParticipantResponse;

namespace VideoWeb.Mappings
{
    public static class ParticipantStatusResponseForVhoMapper
    {
        public static IEnumerable<ParticipantContactDetailsResponseVho> MapParticipantsTo(
            Conference conference,
            IEnumerable<JudgeInHearingResponse> judgesInHearings)
        {
            var conferenceId = conference.Id;
            var hearingVenueName = conference.HearingVenueName;
            
            var pats = conference.Participants
                .OrderBy(x => x.CaseTypeGroup)
                .Select(x =>
                {
                    var status = Enum.Parse<ParticipantStatus>(x.ParticipantStatus.ToString());
                    var judgeInHearing = judgesInHearings.Where(j => j.Username == x.Username && j.Id != x.Id);

                    return new ParticipantContactDetailsResponseVho
                    {
                        Id = x.Id,
                        ConferenceId = conferenceId,
                        Name = x.Name,
                        Role = x.Role,
                        Username = x.Username,
                        CaseTypeGroup = x.CaseTypeGroup,
                        RefId = x.RefId,
                        FirstName = x.FirstName,
                        LastName = x.LastName,
                        DisplayName = x.DisplayName,
                        Status = status,
                        ContactEmail = x.ContactEmail,
                        ContactTelephone = x.ContactTelephone,
                        HearingVenueName = hearingVenueName,
                        JudgeInAnotherHearing = judgeInHearing.Any()
                    };
                });
            return pats.ToList();
        }
    }
}
