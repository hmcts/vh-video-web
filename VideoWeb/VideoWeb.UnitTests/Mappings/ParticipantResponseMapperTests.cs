using System;
using FizzWare.NBuilder;
using FluentAssertions;
using NUnit.Framework;
using VideoWeb.Contract.Responses;
using VideoWeb.Mappings;
using VideoWeb.Services.Video;
using UserRole = VideoWeb.Contract.Responses.UserRole;

namespace VideoWeb.UnitTests.Mappings
{
    public class ParticipantResponseMapperTests
    {
        private readonly ParticipantResponseMapper _mapper = new ParticipantResponseMapper();

        [Test]
        public void should_map_all_properties()
        {
            const ParticipantStatus expectedStatus = ParticipantStatus.Available;
            const UserRole expectedRole = UserRole.Individual;
            var participant = Builder<ParticipantDetailsResponse>.CreateNew()
                .With(x => x.Current_status = new ParticipantStatusResponse
                {
                    Participant_state = ParticipantState.Available,
                    Time_stamp = DateTime.UtcNow
                })
                .With(x => x.User_role = Services.Video.UserRole.Individual)
                .Build();

            var response = _mapper.MapParticipantToResponseModel(participant);
            response.Id.Should().Be(participant.Id.GetValueOrDefault());
            response.Name.Should().Be(participant.Name);
            response.Username.Should().Be(participant.Username);
            response.Status.Should().Be(expectedStatus);
            response.Role.Should().Be(expectedRole);

        }
    }
}