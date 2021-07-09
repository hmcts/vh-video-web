using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VideoApi.Contract.Requests;
using VideoWeb.Contract.Responses;
using VideoWeb.EventHub.Models;
using VideoWeb.Mappings.Interfaces;

namespace VideoWeb.Mappings
{
    public class ParticipantsUpdatedMapper : IMapTo<UpdateConferenceParticipantsRequest, ParticipantsUpdated>
    {
        private readonly IMapperFactory _mapperFactory;

        public ParticipantsUpdatedMapper(IMapperFactory mapperFactory)
        {
            _mapperFactory = mapperFactory;
        }

        public ParticipantsUpdated Map(UpdateConferenceParticipantsRequest request)
        {
            var participantUpdatedMapper = _mapperFactory.Get<UpdateParticipantRequest, ParticipantUpdatedResponse>();
            var participantAddedMapper = _mapperFactory.Get<ParticipantRequest, ParticipantAddedResponse>();
            var linkedParticipantsMapper = _mapperFactory.Get<LinkedParticipantRequest, LinkedParticipantsResponse>();

            return new ParticipantsUpdated()
            {
                UpdatedParticipants = request.ExistingParticipants.Select(participant => participantUpdatedMapper.Map(participant)).ToList(),
                AddedParticipants = request.NewParticipants.Select(participant => participantAddedMapper.Map(participant)).ToList(),
                RemovedParticipants = request.RemovedParticipants,
                LinkedParticipants = request.LinkedParticipants.Select(participant => linkedParticipantsMapper.Map(participant)).ToList(),
            };
        }
    }
}
