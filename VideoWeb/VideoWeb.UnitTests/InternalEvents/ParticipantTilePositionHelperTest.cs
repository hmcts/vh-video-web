using System;
using System.Collections.Generic;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.InternalEvents
{
    [TestFixture]
    public class ParticipantTilePositionHelperTest
    {
        private List<ParticipantResponse> _participants;

        [SetUp]
        public void SetUp()
        {
            _participants = new List<ParticipantResponse>
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
        }

        [Test]
        public void Should_set_tailed_display_names_for_non_judge_participants_number_participant()
        {
            ParticipantTilePositionHelper.AssignTilePositions(_participants);

            _participants[0].TiledDisplayName.Should().Be($"JUDGE;{ParticipantTilePositionHelper.Heartbeat};{_participants[0].DisplayName};{_participants[0].Id}");
            _participants[1].TiledDisplayName.Should().Be($"CIVILIAN;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[1].DisplayName};{_participants[1].Id}");
            _participants[2].TiledDisplayName.Should().Be($"CIVILIAN;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[2].DisplayName};{_participants[2].Id}");
            _participants[3].TiledDisplayName.Should().Be($"CIVILIAN;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[3].DisplayName};{_participants[3].Id}");
            _participants[4].TiledDisplayName.Should().Be($"CIVILIAN;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[4].DisplayName};{_participants[4].Id}");
            _participants[5].TiledDisplayName.Should().Be($"CIVILIAN;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[5].DisplayName};{_participants[5].Id}");
            _participants[6].TiledDisplayName.Should().Be($"WITNESS;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[6].DisplayName};{_participants[6].Id}");
            _participants[7].TiledDisplayName.Should().Be($"CIVILIAN;{ParticipantTilePositionHelper.NoHeartbeat};{_participants[7].DisplayName};{_participants[7].Id}");

        }
    }
}
