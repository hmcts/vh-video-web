using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Builders
{
    public class ConferenceCacheModelBuilder
    {
        private readonly ConferenceDto _conferenceDto;

        public ConferenceCacheModelBuilder()
        {
            _conferenceDto = new ConferenceDto
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<ParticipantDto>()
                {
                    Builder<ParticipantDto>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .With(x => x.Username = Faker.Internet.Email())
                        .Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<ParticipantDto>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<EndpointDto>
                {
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .Build(),
                    Builder<EndpointDto>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .Build()
                },
                HearingVenueName = "Hearing Venue Test"
            };
        }

        public ConferenceCacheModelBuilder WithJudicialOfficeHolders(int count = 2)
        {
            var participants = Builder<ParticipantDto>.CreateListOfSize(count)
                .All().With(x => x.Id = Guid.NewGuid())
                .With(x => x.Username = Faker.Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipant>())
                .With(x => x.Role = Role.JudicialOfficeHolder).Build().ToList();
            _conferenceDto.Participants.AddRange(participants);
            
            return this;
        }

        public ConferenceCacheModelBuilder WithLinkedParticipantsInRoom()
        {
            _conferenceDto.CivilianRooms = new List<CivilianRoomDto>
            {
                new CivilianRoomDto {Id = 1, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
            };
            var participantA = _conferenceDto.Participants[1];
            var participantB = _conferenceDto.Participants[2];
            participantA.LinkedParticipants.Add(new LinkedParticipant{LinkedId = participantB.Id, LinkType = LinkType.Interpreter});
            participantB.LinkedParticipants.Add(new LinkedParticipant{LinkedId = participantA.Id, LinkType = LinkType.Interpreter});
            
            _conferenceDto.CivilianRooms[0].Participants.Add(participantA.Id);
            _conferenceDto.CivilianRooms[0].Participants.Add(participantB.Id);

            return this;
        }

        public ConferenceDto Build()
        {
            return _conferenceDto;
        }
    }
}
