using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantForUserResponseMapperTests
    {
        [Test]
        public void Should_map_all_participants()
        {
            var participants = new List<ParticipantSummaryResponse>()
            {
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.User_role = UserRole.Judge)
                    .With(x => x.Case_group = "Judge")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .Build(),
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.User_role = UserRole.Individual)
                    .With(x => x.Case_group = "Applicant")
                    .With(x => x.Status = ParticipantState.Joining)
                    .With(x => x.Id = Guid.NewGuid()).Build(),
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.User_role = UserRole.Representative)
                    .With(x => x.Case_group = "Applicant")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid()).Build(),
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.User_role = UserRole.Individual)
                    .With(x => x.Case_group = "Defendant")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid()).Build(),
                Builder<ParticipantSummaryResponse>.CreateNew().
                    With(x => x.User_role = UserRole.Representative)
                    .With(x => x.Case_group = "Defendant")
                    .With(x => x.Status = ParticipantState.InConsultation)
                    .With(x => x.Id = Guid.NewGuid()).Build()
            };

            var response = ParticipantForUserResponseMapper.MapParticipants(participants);

            for (var index = 0; index < participants.Count; index++)
            {
                var participant = participants[index];
                response[index].Id.Should().Be(participant.Id);
                response[index].Username.Should().BeEquivalentTo(participant.Username);
                response[index].DisplayName.Should().BeEquivalentTo(participant.Display_name);
                response[index].Role.Should().BeEquivalentTo(participant.User_role);
                response[index].Status.ToString().Should().BeEquivalentTo(participant.Status.ToString());
                response[index].Representee.Should().BeEquivalentTo(participant.Representee);
                response[index].CaseTypeGroup.Should().BeEquivalentTo(participant.Case_group);
                response[index].TiledDisplayName.Should().NotBeNullOrWhiteSpace();
            }
            
            var tiledNames = response.Select(x => x.TiledDisplayName).ToList();

            foreach (var participantResponse in response)
            {
                var position = participantResponse.TiledDisplayName.Split(';');
                if (participantResponse.Role == Role.Judge)
                {
                    participantResponse.TiledDisplayName.StartsWith("T0").Should().BeTrue();
                }

                if (position[0].StartsWith("T"))
                {
                    tiledNames.Count(x => x.StartsWith(position[0])).Should().Be(1);
                }
            }
        }
    }
}
