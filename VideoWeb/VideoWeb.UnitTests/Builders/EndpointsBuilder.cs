using FizzWare.NBuilder;
using System;
using VideoWeb.Common.Models;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.Builders;

public class EndpointsBuilder
{
    private readonly Endpoint _endpoint;

    public EndpointsBuilder()
    {
        _endpoint = Builder<Endpoint>.CreateNew()
            .With(x => x.Id = Guid.NewGuid())
            .With(x => x.EndpointStatus = EndpointStatus.Connected)
            .With(x => x.DisplayName="DisplayName")
            .Build();
    }

    public EndpointsBuilder WithStatus(EndpointStatus state)
    {
        _endpoint.EndpointStatus = state;
        return this;
    }

    public EndpointsBuilder WithCurrentRoom()
    {
        _endpoint.CurrentRoom = new ConsultationRoom()
        { 
            Id = 1,
            Label = "Room 1",
            Locked = true
        };
        return this;
    }

    public Endpoint Build()
    {
        return _endpoint;
    }
}
