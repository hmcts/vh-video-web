using System;
using System.Collections.Generic;
using System.Linq;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings.Interfaces;
using VideoApi.Contract.Responses;
using ParticipantStatus = VideoWeb.Common.Models.ParticipantStatus;

namespace VideoWeb.Mappings
{
    public class ParticipantStatusResponseForVhoMapper : IMapTo<Conference, IEnumerable<ParticipantInHearingResponse>, IEnumerable<ParticipantContactDetailsResponseVho>>
    {
        public IEnumerable<ParticipantContactDetailsResponseVho> Map(
            Conference conference,
            IEnumerable<ParticipantInHearingResponse> judgesInHearings)
        {
            var conferenceId = conference.Id;
            var hearingVenueName = conference.HearingVenueName;
            
            var pats = conference.Participants
                .OrderBy(x => x.CaseTypeGroup)
                .Select(x =>
                {
                    var status = Enum.Parse<ParticipantStatus>(x.ParticipantStatus.ToString());
                    var judgeInHearing = judgesInHearings.Where(j => j.Username == x.Username && j.Id != x.Id);
                    var links = x.LinkedParticipants.Select(x =>
                        new Contract.Responses.LinkedParticipantResponse
                        {
                            LinkedId = x.LinkedId,
                            LinkType = x.LinkType
                        }).ToList();
                    return new ParticipantContactDetailsResponseVho
                    {
                        Id = x.Id,
                        ConferenceId = conferenceId,
                        Name = x.Name,
                        Role = x.Role,
                        HearingRole = x.HearingRole,
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
                        JudgeInAnotherHearing = judgeInHearing.Any(),
                        Representee = x.Representee,
                        LinkedParticipants = links
                    };
                });
            return pats.ToList();
        }
    }
}
