using System;
using System.Collections.Generic;
using System.Linq;
using FizzWare.NBuilder;
using VideoWeb.Common.Models;

namespace VideoWeb.UnitTests.Builders
{
    public class ConferenceCacheModelBuilder
    {
        private readonly Conference _conference;

        public ConferenceCacheModelBuilder()
        {
            _conference = new Conference
            {
                Id = Guid.NewGuid(),
                HearingId = Guid.NewGuid(),
                Participants = new List<Participant>()
                {
                    Builder<Participant>.CreateNew()
                        .With(x => x.Role = Role.Judge).With(x => x.Id = Guid.NewGuid())
                        .With(x => x.Username = Faker.Internet.Email())
                        .Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Individual)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build(),
                    Builder<Participant>.CreateNew().With(x => x.Role = Role.Representative)
                        .With(x => x.Username = Faker.Internet.Email())
                        .With(x => x.Id = Guid.NewGuid()).Build()
                },
                Endpoints = new List<Endpoint>
                {
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP1")
                        .Build(),
                    Builder<Endpoint>.CreateNew().With(x => x.Id = Guid.NewGuid()).With(x => x.DisplayName = "EP2")
                        .Build()
                },
                HearingVenueName = "Hearing Venue Test"
            };
        }

        public ConferenceCacheModelBuilder WithJudicialOfficeHolders(int count = 2)
        {
            var participants = Builder<Participant>.CreateListOfSize(count)
                .All().With(x => x.Id = Guid.NewGuid())
                .With(x => x.Username = Faker.Internet.Email())
                .With(x => x.LinkedParticipants = new List<LinkedParticipant>())
                .With(x => x.Role = Role.JudicialOfficeHolder).Build().ToList();
            _conference.Participants.AddRange(participants);
            
            return this;
        }

        public ConferenceCacheModelBuilder WithLinkedParticipantsInRoom()
        {
            _conference.CivilianRooms = new List<CivilianRoom>
            {
                new CivilianRoom {Id = 1, RoomLabel = "Interpreter1", Participants = new List<Guid>()}
            };
            var participantA = _conference.Participants[1];
            var participantB = _conference.Participants[2];
            participantA.LinkedParticipants.Add(new LinkedParticipant{LinkedId = participantB.Id, LinkType = LinkType.Interpreter});
            participantB.LinkedParticipants.Add(new LinkedParticipant{LinkedId = participantA.Id, LinkType = LinkType.Interpreter});
            
            _conference.CivilianRooms[0].Participants.Add(participantA.Id);
            _conference.CivilianRooms[0].Participants.Add(participantB.Id);

            return this;
        }

        public Conference Build()
        {
            return _conference;
        }
    }
}
