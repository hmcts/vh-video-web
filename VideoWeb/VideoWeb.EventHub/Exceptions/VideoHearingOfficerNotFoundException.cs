using System;

namespace VideoWeb.EventHub.Exceptions
{
#pragma warning disable S3925 // "ISerializable" should be implemented correctly
    public class VideoHearingOfficerNotFoundException : Exception
    {
        public VideoHearingOfficerNotFoundException(Guid hearingRefId) : base(
            $"Video Hearings Officer cannot be found for {hearingRefId}")
        {
        }
    }
}