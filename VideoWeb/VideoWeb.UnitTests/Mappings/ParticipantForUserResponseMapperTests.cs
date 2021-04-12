using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Common.Models;
using VideoWeb.Mappings;
using VideoApi.Contract.Responses;
using VideoApi.Contract.Enums;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantForUserResponseMapperTests : BaseMockerSutTestSetup<ParticipantForUserResponseMapper>
    {
        [Test]
        public void Should_map_all_participants()
        {
            var participants = new List<ParticipantSummaryResponse>()
            {
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Judge)
                    .With(x => x.CaseGroup = "Judge")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Individual)
                    .With(x => x.CaseGroup = "Applicant")
                    .With(x => x.Status = ParticipantState.Joining)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Representative)
                    .With(x => x.CaseGroup = "Applicant")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantSummaryResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Individual)
                    .With(x => x.CaseGroup = "Defendant")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantSummaryResponse>.CreateNew().With(x => x.UserRole = UserRole.Representative)
                    .With(x => x.CaseGroup = "Defendant")
                    .With(x => x.Status = ParticipantState.InConsultation)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantSummaryResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual)
                    .With(x => x.CaseGroup = "Defendant")
                    .With(x => x.HearingRole = "Interpreter")
                    .With(x => x.Status = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build()
            };

            var interpreter = participants.First(p => p.HearingRole == "Interpreter");
            var interpretee = participants.First(p =>
                p.CaseGroup == "Defendant" && p.UserRole == UserRole.Individual && p.Id != interpreter.Id);

            interpretee.LinkedParticipants.Add(new LinkedParticipantResponse{LinkedId = interpreter.Id, Type = LinkedParticipantType.Interpreter});
            interpreter.LinkedParticipants.Add(new LinkedParticipantResponse{LinkedId = interpretee.Id, Type = LinkedParticipantType.Interpreter});
            
            var response = _sut.Map(participants);

            for (var index = 0; index < participants.Count; index++)
            {
                var participant = participants[index];
                response[index].Id.Should().Be(participant.Id);
                response[index].DisplayName.Should().BeEquivalentTo(participant.DisplayName);
                response[index].Role.Should().BeEquivalentTo(participant.UserRole);
                response[index].Status.ToString().Should().BeEquivalentTo(participant.Status.ToString());
                response[index].Representee.Should().BeEquivalentTo(participant.Representee);
                response[index].CaseTypeGroup.Should().BeEquivalentTo(participant.CaseGroup);
                response[index].TiledDisplayName.Should().NotBeNullOrWhiteSpace();
                response[index].HearingRole.Should().BeEquivalentTo(participant.HearingRole);
            }
            
            var tiledNames = response.Select(x => x.TiledDisplayName).ToList();

            foreach (var participantResponse in response)
            {
                var position = participantResponse.TiledDisplayName.Split(';');
                if (participantResponse.Role == Role.Judge)
                {
                    participantResponse.TiledDisplayName.StartsWith("JUDGE").Should().BeTrue();
                }

                if (position[0].StartsWith("CIVILIAN") || position[0].StartsWith("WITNESS"))
                {
                    tiledNames.Count(x => x.StartsWith(position[0])).Should().Be(5);
                }
            }
        }
    }
}
