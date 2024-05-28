using FluentAssertions;
using NUnit.Framework;
using VideoWeb.EventHub.Enums;
using VideoWeb.EventHub.Mappers;
using VideoWeb.EventHub.Models;
using VideoApi.Contract.Requests;

namespace VideoWeb.UnitTests.Mappings
{
    public class HeartbeatRequestMapperTests
    {
        private readonly HeartbeatRequestMapper _mapper = new();
        
        [Test]
        public void Should_map_to_add_heartbeat_request()
        {
            var heartbeat = new Heartbeat
            {
                BrowserName = "test_browser", BrowserVersion = "123",
                IncomingAudioPercentageLost = 1.56m, IncomingVideoPercentageLost = 2.56m,
                OutgoingAudioPercentageLost = 3.56m, OutgoingVideoPercentageLost = 4.56m,
                IncomingAudioPercentageLostRecent = 5.56m, IncomingVideoPercentageLostRecent = 6.56m,
                OutgoingAudioPercentageLostRecent = 7.56m, OutgoingVideoPercentageLostRecent = 8.56m,
                OutgoingAudioPacketsLost = 0,
                OutgoingAudioBitrate = "25kbps",
                OutgoingAudioCodec = "opus",
                OutgoingAudioPacketSent = 1,
                OutgoingVideoPacketSent = 1,
                OutgoingVideoPacketsLost = 0,
                OutgoingVideoFramerate = 25,
                OutgoingVideoBitrate = "2kbps",
                OutgoingVideoCodec = "H264",
                OutgoingVideoResolution = "640x480",
                IncomingAudioBitrate = "18kbps",
                IncomingAudioCodec = "opus",
                IncomingAudioPacketReceived = 1,
                IncomingAudioPacketsLost = 0,
                IncomingVideoBitrate = "106kbps",
                IncomingVideoCodec = "VP8",
                IncomingVideoResolution = "1280x720",
                IncomingVideoPacketReceived = 1,
                IncomingVideoPacketsLost = 0,
                Device="iPhone"
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
            result.OutgoingAudioPacketsLost.Should().Be(0);
            result.OutgoingAudioBitrate.Should().Be("25kbps");
            result.OutgoingAudioCodec.Should().Be("opus");
            result.OutgoingAudioPacketSent.Should().Be(1);
            result.OutgoingVideoPacketSent.Should().Be(1);
            result.OutgoingVideoPacketsLost.Should().Be(0);
            result.OutgoingVideoFramerate.Should().Be(25);
            result.OutgoingVideoBitrate.Should().Be("2kbps");
            result.OutgoingVideoCodec.Should().Be("H264");
            result.OutgoingVideoResolution.Should().Be("640x480");
            result.IncomingAudioBitrate.Should().Be("18kbps");
            result.IncomingAudioCodec.Should().Be("opus");
            result.IncomingAudioPacketReceived.Should().Be(1);
            result.IncomingAudioPacketsLost.Should().Be(0);
            result.IncomingVideoBitrate.Should().Be("106kbps");
            result.IncomingVideoCodec.Should().Be("VP8");
            result.IncomingVideoResolution.Should().Be("1280x720");
            result.IncomingVideoPacketReceived.Should().Be(1);
            result.IncomingVideoPacketsLost.Should().Be(0);
            result.Device.Should().Be("iPhone");


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
            .Should().NotBe(null)
            .And.Be(HeartbeatHealth.Good);
            
            // Bad if greater than 15 (include)
            _mapper.MapToHealth(new Heartbeat
                {
                    IncomingAudioPercentageLostRecent = 1m,
                    IncomingVideoPercentageLostRecent = 2m,
                    OutgoingAudioPercentageLostRecent = 16m,
                    OutgoingVideoPercentageLostRecent = 4m
                })
                .Should().NotBe(null)
                .And.Be(HeartbeatHealth.Bad);

            // Poor between 10(inculde) and 15
            _mapper.MapToHealth(new Heartbeat
                {
                    IncomingAudioPercentageLostRecent = 1m,
                    IncomingVideoPercentageLostRecent = 2m,
                    OutgoingAudioPercentageLostRecent = 3m,
                    OutgoingVideoPercentageLostRecent = 14m
                })
                .Should().NotBe(null)
                .And.Be(HeartbeatHealth.Poor);
        }
    }
}
