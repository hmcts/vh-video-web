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
    public class ParticipantResponseForUserMapperTests : BaseMockerSutTestSetup<ParticipantResponseForUserMapper>
    {
        [Test]
        public void Should_map_all_participants()
        {
            var interpreterId = Guid.NewGuid();
            var interpreteeId = Guid.NewGuid();
            var participants = new List<ParticipantResponse>()
            {
                Builder<ParticipantResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Judge)
                    .With(x => x.CurrentStatus = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.StaffMember)
                    .With(x => x.CurrentStatus = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Individual)
                    .With(x => x.CurrentStatus = ParticipantState.Joining)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Representative)
                    .With(x => x.CurrentStatus = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantResponse>.CreateNew()
                    .With(x => x.UserRole = UserRole.Individual)
                    .With(x => x.CurrentStatus = ParticipantState.Available)
                    .With(x => x.Id = Guid.NewGuid())
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantResponse>.CreateNew().With(x => x.UserRole = UserRole.Representative)
                    .With(x => x.CurrentStatus = ParticipantState.InConsultation)
                    .With(x => x.Id = interpreteeId)
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build(),
                Builder<ParticipantResponse>.CreateNew().With(x => x.UserRole = UserRole.Individual)
                    .With(x => x.CurrentStatus = ParticipantState.Available)
                    .With(x => x.Id = interpreterId)
                    .With(x => x.LinkedParticipants = new List<LinkedParticipantResponse>())
                    .Build()
            };

            var interpreter = participants.First(p => p.Id == interpreterId);
            var interpretee = participants.First(p => p.Id == interpreteeId);

            interpretee.LinkedParticipants.Add(new LinkedParticipantResponse{LinkedId = interpreter.Id, Type = LinkedParticipantType.Interpreter});
            interpreter.LinkedParticipants.Add(new LinkedParticipantResponse{LinkedId = interpretee.Id, Type = LinkedParticipantType.Interpreter});
            
            var response = _sut.Map(participants);

            for (var index = 0; index < participants.Count; index++)
            {
                var participant = participants[index];
                response[index].Id.Should().Be(participant.Id);
                response[index].DisplayName.Should().BeEquivalentTo(participant.DisplayName);
                response[index].Role.Should().Be((Role)participant.UserRole);
                response[index].Status.ToString().Should().BeEquivalentTo(participant.CurrentStatus.ToString());
                response[index].TiledDisplayName.Should().NotBeNullOrWhiteSpace();
            }
            
            var tiledNames = response.Select(x => x.TiledDisplayName).ToList();

            foreach (var participantResponse in response)
            {
                var position = participantResponse.TiledDisplayName.Split(';');
                if (participantResponse.Role == Role.Judge)
                {
                    participantResponse.TiledDisplayName.StartsWith("JUDGE").Should().BeTrue();
                }
                if (participantResponse.Role == Role.StaffMember)
                {
                    participantResponse.TiledDisplayName.StartsWith("CLERK").Should().BeTrue();
                }

                if (position[0].StartsWith("CIVILIAN") || position[0].StartsWith("WITNESS"))
                {
                    tiledNames.Count(x => x.StartsWith(position[0])).Should().Be(5);
                }
            }
        }
    }
}
