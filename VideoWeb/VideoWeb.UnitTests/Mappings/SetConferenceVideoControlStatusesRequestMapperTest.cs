using FluentAssertions;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.Text;
using VideoApi.Contract.Responses;
using VideoWeb.Contract.Request;
using VideoWeb.Mappings;
using static VideoWeb.Contract.Request.SetConferenceVideoControlStatusesRequest;

namespace VideoWeb.UnitTests.Mappings
{
    public class SetConferenceVideoControlStatusesRequestMapperTest : BaseMockerSutTestSetup<SetConferenceVideoControlStatusesRequestMapper>
    {

        [Test]
        public void Should_return_null_if_input_is_null()
        {
            _sut.Map(null).Should().BeNull();
        }

        [Test]
        public void Should_set_label()
        {
            var input = new SetConferenceVideoControlStatusesRequest();
            input.ParticipantIdToVideoControlStatusMap = new Dictionary<string, VideoControlStatusRequest>();
            input.ParticipantIdToVideoControlStatusMap.Add("first entry", new VideoControlStatusRequest { IsLocalAudioMuted = true, IsLocalVideoMuted = true, IsSpotlighted = true });
            var result = _sut.Map(input);
            result.ParticipantIdToVideoControlStatusMap.Should().NotBeNull();
            result.ParticipantIdToVideoControlStatusMap["first entry"].IsSpotlighted.Should().BeTrue();
            result.ParticipantIdToVideoControlStatusMap["first entry"].IsLocalVideoMuted.Should().BeTrue();
            result.ParticipantIdToVideoControlStatusMap["first entry"].IsLocalAudioMuted.Should().BeTrue();
        }
    }
}
