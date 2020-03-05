using System;

namespace VideoWeb.EventHub.Exceptions
{
    public class HeartbeatException : Exception
    {
        public HeartbeatException(string message) : base(message){}
    }
}
