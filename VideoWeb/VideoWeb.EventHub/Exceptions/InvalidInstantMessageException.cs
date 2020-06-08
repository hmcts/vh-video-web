using System;

namespace VideoWeb.EventHub.Exceptions
{
#pragma warning disable S3925 // "ISerializable" should be implemented correctly
    public class InvalidInstantMessageException : Exception
    {
        public InvalidInstantMessageException(string message) : base(message)
        {
        }
    }
}
