using FluentAssertions;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Models;
using VideoWeb.Services.Video;

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
            result.Browser_name.Should().Be(heartbeat.BrowserName);
            result.Browser_version.Should().Be(heartbeat.BrowserVersion);
            result.Incoming_audio_percentage_lost.Should().Be(1.56m);
            result.Incoming_video_percentage_lost.Should().Be(2.56m);
            result.Outgoing_audio_percentage_lost.Should().Be(3.56m);
            result.Outgoing_video_percentage_lost.Should().Be(4.56m);
            result.Incoming_audio_percentage_lost_recent.Should().Be(5.56m);
            result.Incoming_video_percentage_lost_recent.Should().Be(6.56m);
            result.Outgoing_audio_percentage_lost_recent.Should().Be(7.56m);
            result.Outgoing_video_percentage_lost_recent.Should().Be(8.56m);
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
