using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;
using static VideoWeb.Contract.Request.SetConferenceVideoControlStatusesRequest;

namespace VideoWeb.UnitTests.Mappings;

public class SetConferenceVideoControlStatusesRequestMapperTest
{
    
    [Test]
    public void Should_return_null_if_input_is_null()
    {
        SetConferenceVideoControlStatusesRequestMapper.Map(null).Should().BeNull();
    }
    
    [Test]
    public void Should_set_label()
    {
        var input = new SetConferenceVideoControlStatusesRequest();
        input.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatusRequest>();
        input.ParticipantIdToVideoControlStatusMap.Add("first entry", new VideoControlStatusRequest { IsLocalAudioMuted = true, IsHandRaised = true, IsLocalVideoMuted = true, IsSpotlighted = true, IsRemoteMuted = true});
        var result = SetConferenceVideoControlStatusesRequestMapper.Map(input);
        result.ParticipantIdToVideoControlStatusMap.Should().NotBeNull();
        result.ParticipantIdToVideoControlStatusMap["first entry"].IsSpotlighted.Should().BeTrue();
        result.ParticipantIdToVideoControlStatusMap["first entry"].IsHandRaised.Should().BeTrue();
        result.ParticipantIdToVideoControlStatusMap["first entry"].IsRemoteMuted.Should().BeTrue();
        result.ParticipantIdToVideoControlStatusMap["first entry"].IsLocalVideoMuted.Should().BeTrue();
        result.ParticipantIdToVideoControlStatusMap["first entry"].IsLocalAudioMuted.Should().BeTrue();
    }
}
