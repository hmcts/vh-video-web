using FizzWare.NBuilder;
using System;
using VideoWeb.Services.Video;

namespace VideoWeb.UnitTests.Builders
{
    public class EndpointsResponseBuilder
    {
        private readonly EndpointResponse _endpoint;

        public EndpointsResponseBuilder()
        {
            _endpoint = Builder<EndpointResponse>.CreateNew()
                .With(x => x.Id = Guid.NewGuid())
                .With(x => x.Status = EndpointState.Connected).Build();
        }

        public EndpointsResponseBuilder WithStatus(EndpointState state)
        {
            _endpoint.Status = state;
            return this;
        }

        public EndpointResponse Build()
        {
            return _endpoint;
        }
    }
}
