using System;
using NUnit.Framework;
using VideoWeb.Helpers;

namespace VideoWeb.UnitTests.Helpers;

public class IngestUrlHelperTest
{
    [TestCase("rtmps://vh-wowza.dev.platform.hmcts.net:443/vh-recording-app/ZZY13-1229Test-d5a81860-7a09-4ba4-8ef1-03dbd71e6751", "ZZY13-1229Test-d5a81860-7a09-4ba4-8ef1-03dbd71e6751")]
    [TestCase("rtmps://vh-wowza.dev.platform.hmcts.net:443/vh-recording-app/BBA1-InterpreterLinkTest-aee584fa-2c89-4e1e-8706-8b2a78c83f74", "BBA1-InterpreterLinkTest-aee584fa-2c89-4e1e-8706-8b2a78c83f74")]
    [TestCase("rtmps://vh-wowza.dev.platform.hmcts.net:443/vh-recording-app/56cd9c22-f402-404a-b17f-3b703a5d46e3", "56cd9c22-f402-404a-b17f-3b703a5d46e3")]
    [TestCase("rtmps://vh-wowza-dev.hearings.reform.hmcts.net:443/f1c4b2d8-6d28-454f-b619-3c049dd4d488/f1c4b2d8-6d28-454f-b619-3c049dd4d488", null)]
    public void Should_return_audio_stream_file_name(string ingestUrl, string expected)
    {
        var audioStreamFileName = ingestUrl.GetAudioStreamFileName();
        Assert.AreEqual(expected, audioStreamFileName);
    }
}
