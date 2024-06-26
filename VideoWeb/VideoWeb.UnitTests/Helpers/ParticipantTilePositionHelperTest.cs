using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Common.Models;
using VideoWeb.Contract.Responses;
using VideoWeb.Helpers;
using FluentAssertions;


namespace VideoWeb.UnitTests.Helpers
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
                new (){Id= Guid.NewGuid(), Role=Role.Judge,DisplayName = "Judge", HearingRole = "judge"},
                new (){Id=Guid.NewGuid(), Role=Role.Individual, DisplayName = "Part1", HearingRole = "Applicant"},
                new (){Id=Guid.NewGuid(), Role=Role.Representative, DisplayName = "Part2", HearingRole = "Applicant"},
                new (){Id=Guid.NewGuid(), Role=Role.JudicialOfficeHolder, DisplayName = "Part3", HearingRole = "Applicant"},
                new (){Id=Guid.NewGuid(), Role = Role.Individual, DisplayName = "Part4", HearingRole = "Applicant" },
                new (){Id=Guid.NewGuid(), Role = Role.Representative, DisplayName = "Part5", HearingRole = "Applicant" },
                new (){Id=Guid.NewGuid(), Role = Role.JudicialOfficeHolder, DisplayName = "Part6", HearingRole = "Witness" },
                new (){Id=Guid.NewGuid(), Role = Role.Individual, DisplayName = "Part7", HearingRole = "Applicant" }
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
