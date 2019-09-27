using System;
using VideoWeb.EventHub.Enums;

namespace VideoWeb.EventHub.Exceptions
{
#pragma warning disable S3925 // "ISerializable" should be implemented correctly
    public class RoomTransferException : Exception
    {
        public RoomTransferException(RoomType roomFrom, RoomType roomTo) : base(
            $"Unable to process TransferEvent from: {roomFrom}, to: {roomTo} to participant a status")
        {
        }
    }
}