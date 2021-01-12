using System;

namespace VideoWeb.EventHub.Exceptions
{
#pragma warning disable S3925 // "ISerializable" should be implemented correctly
    public class RoomTransferException : Exception
    {
        public RoomTransferException(string roomFrom, string roomTo) : base(
            $"Unable to process TransferEvent from: {roomFrom}, to: {roomTo} to a status")
        {
        }
    }
}
