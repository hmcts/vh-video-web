using FizzWare.NBuilder;
using System;
using VideoApi.Contract.Enums;
using VideoApi.Contract.Responses;

namespace VideoWeb.UnitTests.Builders
{
    public class EndpointsBuilder
    {
        private readonly EndpointResponse _endpoint;

        public EndpointsBuilder()
        {
            _endpoint = Builder<EndpointResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Status = EndpointState.Connected)
                .With(x=>x.DisplayName="DisplayName")
                .Build();
        }

        public EndpointsBuilder WithStatus(EndpointState state)
        {
            _endpoint.Status = state;
            return this;
        }

        public EndpointsBuilder WithCurrentRoom()
        {
            _endpoint.CurrentRoom = new RoomResponse
            {
                Id = 1,
                Label = "Room 1",
                Locked = true
            };
            return this;
        }

        public EndpointResponse Build()
        {
            return _endpoint;
        }
    }
}
