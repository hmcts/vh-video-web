using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using FluentAssertions;


namespace VideoWeb.UnitTests.Helpers
{
    public class ParticipantTilePositionHelperTest
    {
        [Test]
        public void Should_set_tailed_display_names_for_non_judge_participants_number_participants_less_than_4()
        {
            var participants = GetParticipantResponses(true);
            ParticipantTilePositionHelper.AssignTilePositions(participants);

            participants[0].TiledDisplayName.Should().Contain("T0;");
            participants[1].TiledDisplayName.Should().Contain("T1;");
            participants[2].TiledDisplayName.Should().Contain("T3;");
            participants[3].TiledDisplayName.Should().Contain("T5;");

        }

        [Test]
        public void Should_set_tailed_display_names_for_non_judge_participants_number_participants_more_than_4()
        {
            var participants = GetParticipantResponses(false);
            ParticipantTilePositionHelper.AssignTilePositions(participants);

            participants[0].TiledDisplayName.Should().Contain("T0;");
            participants[1].TiledDisplayName.Should().Contain("T1;");
            participants[2].TiledDisplayName.Should().Contain("T2;");
            participants[3].TiledDisplayName.Should().Contain("T3;");
            participants[4].TiledDisplayName.Should().Contain("T4;");
            participants[5].TiledDisplayName.Should().Contain("T5;");
            participants[6].TiledDisplayName.Should().Contain("W6;");

        }

        private List<ParticipantResponse> GetParticipantResponses(bool lessThanFour)
        {
            var participants = new List<ParticipantResponse>
            {
                new ParticipantResponse{Id= Guid.NewGuid(), Role=Role.Judge,DisplayName = "Judge", HearingRole = "judge"},
                new ParticipantResponse{Id=Guid.NewGuid(), Role=Role.Individual, DisplayName = "Part1", CaseTypeGroup = "group1", HearingRole = "Applicant"},
                new ParticipantResponse{Id=Guid.NewGuid(), Role=Role.Representative, DisplayName = "Part2", CaseTypeGroup = "group1", HearingRole = "Applicant"},
                new ParticipantResponse{Id=Guid.NewGuid(), Role=Role.JudicialOfficeHolder, DisplayName = "Part3", CaseTypeGroup ="group1", HearingRole = "Applicant"},

            };

            if (!lessThanFour)
            {
                var participant = new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.Individual, DisplayName = "Part4", CaseTypeGroup = "group1", HearingRole = "Applicant" };
                var participant1 = new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.JudicialOfficeHolder, DisplayName = "Part5", CaseTypeGroup = "group1", HearingRole = "Applicant" };
                var participant2 = new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.Individual, DisplayName = "Part6", CaseTypeGroup = "group1", HearingRole = "Witness" };
                participants.Add(participant);
                participants.Add(participant1);
                participants.Add(participant2);
            }

            return participants;
        }
    }
}
