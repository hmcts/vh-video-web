using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantStatusResponseForVhoMapperTests : BaseMockerSutTestSetup<ParticipantStatusResponseForVhoMapper>
    {

        [Test]
        public void Should_map_all_properties()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge1 = CreateParticipant("judge1");
            var judge2 = CreateParticipant("judge2");
            var judge3 = CreateParticipant("judge3");
            var judge4 = CreateParticipant("judge4");
            var judge2DifferentHearing = CreateParticipant("judge2");
            var judge3DifferentHearing = CreateParticipant("judge3");
            var judge4DifferentHearing = CreateParticipant("judge4");
            conference.Participants = new List<ParticipantDto>
            {
                judge1, judge2, judge3, judge4
            };

            var judgesInHearings = new List<ParticipantInHearingResponse>
            {
                new ParticipantInHearingResponse
                    {Id = judge2DifferentHearing.Id, Username = judge2.Username, Status = ParticipantState.InHearing},
                new ParticipantInHearingResponse
                    {Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InConsultation},
                new ParticipantInHearingResponse
                    {Id = judge4DifferentHearing.Id, Username = judge4.Username, Status = ParticipantState.Available}
            };

            var results = _sut.Map(conference, judgesInHearings).ToList();

            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, false);
            AssertResponseItem(results.ElementAt(1), conference.Participants[1], conferenceId, true);
            AssertResponseItem(results.ElementAt(2), conference.Participants[2], conferenceId, true);
            AssertResponseItem(results.ElementAt(3), conference.Participants[3], conferenceId, true);
        }

        [Test]
        public void Should_map_all_properties_with_not_matching_booking_participants()
        {
            var conferenceId = Guid.NewGuid();
            var conference = CreateValidConference(conferenceId);

            var judge1 = CreateParticipant("judge1");
            var judge2 = CreateParticipant("judge2");
            var judge3 = CreateParticipant("judge3");
            var judge3DifferentHearing = CreateParticipant("judge3");
            conference.Participants = new List<ParticipantDto>
            {
                judge1, judge2, judge3
            };

            var hostsInHearings = new List<ParticipantInHearingResponse>
            {
                new ParticipantInHearingResponse{ Id = judge3DifferentHearing.Id, Username = judge3.Username, Status = ParticipantState.InHearing }
            };

            var results = _sut.Map(conference, hostsInHearings).ToList();

            AssertResponseItem(results.ElementAt(0), conference.Participants[0], conferenceId, false);
        }
        
        private static void AssertResponseItem(ParticipantContactDetailsResponseVho response, ParticipantDto participantDto, 
            Guid conferenceId, bool isInAnotherHearing)
        {
            response.Id.Should().Be(participantDto.Id);
            response.ConferenceId.Should().Be(conferenceId);
            response.Name.Should().Be(participantDto.Name);
            response.Role.Should().Be(participantDto.Role);
            response.HearingRole.Should().Be(participantDto.HearingRole);
            response.Username.Should().Be(participantDto.Username);
            response.CaseTypeGroup.Should().Be(participantDto.CaseTypeGroup);
            response.RefId.Should().Be(participantDto.RefId);
            response.FirstName.Should().Be(participantDto.FirstName);
            response.LastName.Should().Be(participantDto.LastName);
            response.DisplayName.Should().Be(participantDto.DisplayName);
            response.Status.Should().Be(participantDto.ParticipantStatus);
            response.ContactEmail.Should().Be(participantDto.ContactEmail);
            response.ContactTelephone.Should().Be(participantDto.ContactTelephone);
            response.HearingVenueName.Should().Be("MyVenue");
            response.HostInAnotherHearing.Should().Be(isInAnotherHearing);
            response.Representee.Should().Be(participantDto.Representee);
        }

        private static ParticipantDto CreateParticipant(string username)
        {
            return Builder<ParticipantDto>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Name = username)
                .With(x => x.Role = Role.Judge)
                .With(x => x.Username = username)
                .With(x => x.CaseTypeGroup == ParticipantStatus.Available.ToString())
                .With(x => x.RefId = Guid.NewGuid())
                .With(x=> x.LinkedParticipants = new List<LinkedParticipant>())
                .With(x => x.DisplayName = $"{username} {username}")
                .Build();
        }

        private static ConferenceDto CreateValidConference(Guid conferenceId)
        {
            var conference = Builder<ConferenceDto>.CreateNew()
                .With(x => x.Id = conferenceId)
                .With(x => x.HearingId = Guid.NewGuid())
                .With(x => x.HearingVenueName = "MyVenue")
                .Build();
            
            return conference;
        }
    }
}
