using FluentAssertions;
using NUnit.Framework;
using VideoApi.Contract.Requests;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Models;

namespace VideoWeb.UnitTests.Mappings
{
    public class HeartbeatRequestMapperTests
    {
        private readonly IHeartbeatRequestMapper _mapper;

        public HeartbeatRequestMapperTests()
        {
            _mapper = new HeartbeatRequestMapper();    
        }
        
        [Test]
        public void Should_map_to_add_heartbeat_request()
        {
            var heartbeat = new Heartbeat
            {
                BrowserName = "test_browser", BrowserVersion = "123",
                IncomingAudioPercentageLost = 1.56m, IncomingVideoPercentageLost = 2.56m,
                OutgoingAudioPercentageLost = 3.56m, OutgoingVideoPercentageLost = 4.56m,
                IncomingAudioPercentageLostRecent = 5.56m, IncomingVideoPercentageLostRecent = 6.56m,
                OutgoingAudioPercentageLostRecent = 7.56m, OutgoingVideoPercentageLostRecent = 8.56m
            };

            var result = _mapper.MapToRequest(heartbeat);

            result.Should().NotBeNull().And.BeAssignableTo<AddHeartbeatRequest>();
            result.BrowserName.Should().Be(heartbeat.BrowserName);
            result.BrowserVersion.Should().Be(heartbeat.BrowserVersion);
            result.IncomingAudioPercentageLost.Should().Be(1.56m);
            result.IncomingVideoPercentageLost.Should().Be(2.56m);
            result.OutgoingAudioPercentageLost.Should().Be(3.56m);
            result.OutgoingVideoPercentageLost.Should().Be(4.56m);
            result.IncomingAudioPercentageLostRecent.Should().Be(5.56m);
            result.IncomingVideoPercentageLostRecent.Should().Be(6.56m);
            result.OutgoingAudioPercentageLostRecent.Should().Be(7.56m);
            result.OutgoingVideoPercentageLostRecent.Should().Be(8.56m);
        }

        [Test]
        public void Should_map_to_health_using_thresholds()
        {
            // Good if less than 10 
            _mapper.MapToHealth(new Heartbeat
            {
                IncomingAudioPercentageLostRecent = 1m,
                IncomingVideoPercentageLostRecent = 2m,
                OutgoingAudioPercentageLostRecent = 3m,
                OutgoingVideoPercentageLostRecent = 4m
            })
            .Should().NotBeNull().And.BeAssignableTo<HeartbeatHealth>()
            .And.Be(HeartbeatHealth.Good);
            
            // Bad if greater than 15 (include)
            _mapper.MapToHealth(new Heartbeat
                {
                    IncomingAudioPercentageLostRecent = 1m,
                    IncomingVideoPercentageLostRecent = 2m,
                    OutgoingAudioPercentageLostRecent = 16m,
                    OutgoingVideoPercentageLostRecent = 4m
                })
                .Should().NotBeNull().And.BeAssignableTo<HeartbeatHealth>()
                .And.Be(HeartbeatHealth.Bad);

            // Poor between 10(inculde) and 15
            _mapper.MapToHealth(new Heartbeat
                {
                    IncomingAudioPercentageLostRecent = 1m,
                    IncomingVideoPercentageLostRecent = 2m,
                    OutgoingAudioPercentageLostRecent = 3m,
                    OutgoingVideoPercentageLostRecent = 14m
                })
                .Should().NotBeNull().And.BeAssignableTo<HeartbeatHealth>()
                .And.Be(HeartbeatHealth.Poor);
        }
    }
}
