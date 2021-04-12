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
        public void Should_set_tailed_display_names_for_non_judge_participants_number_participant()
        {
            var participants = GetParticipantResponses();
            ParticipantTilePositionHelper.AssignTilePositions(participants);


            participants[0].TiledDisplayName.Should().Contain("JUDGE;");
            participants[1].TiledDisplayName.Should().Contain("CIVILIAN;");
            participants[2].TiledDisplayName.Should().Contain("CIVILIAN;");
            participants[3].TiledDisplayName.Should().Contain("CIVILIAN;");
            participants[4].TiledDisplayName.Should().Contain("CIVILIAN;");
            participants[5].TiledDisplayName.Should().Contain("CIVILIAN;");
            participants[6].TiledDisplayName.Should().Contain("WITNESS;");
            participants[7].TiledDisplayName.Should().Contain("CIVILIAN;");

        }

        private List<ParticipantResponse> GetParticipantResponses()
        {
            var participants = new List<ParticipantResponse>
            {
                new ParticipantResponse{Id= Guid.NewGuid(), Role=Role.Judge,DisplayName = "Judge", HearingRole = "judge"},
                new ParticipantResponse{Id=Guid.NewGuid(), Role=Role.Individual, DisplayName = "Part1", CaseTypeGroup = "group1", HearingRole = "Applicant"},
                new ParticipantResponse{Id=Guid.NewGuid(), Role=Role.Representative, DisplayName = "Part2", CaseTypeGroup = "group1", HearingRole = "Applicant"},
                new ParticipantResponse{Id=Guid.NewGuid(), Role=Role.JudicialOfficeHolder, DisplayName = "Part3", CaseTypeGroup ="group2", HearingRole = "Applicant"},
                new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.Individual, DisplayName = "Part4", CaseTypeGroup = "group1", HearingRole = "Applicant" },
                new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.Representative, DisplayName = "Part5", CaseTypeGroup = "group1", HearingRole = "Applicant" },
                new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.JudicialOfficeHolder, DisplayName = "Part6", CaseTypeGroup = "group1", HearingRole = "Witness" },
                new ParticipantResponse { Id = Guid.NewGuid(), Role = Role.Individual, DisplayName = "Part7", CaseTypeGroup = "group1", HearingRole = "Applicant" }
            };

            return participants;
        }
    }
}
