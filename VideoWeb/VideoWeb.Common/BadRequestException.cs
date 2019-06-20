using System;
using System.Runtime.Serialization;

namespace VideoWeb.Common
{
    /// <summary>
    /// Exception to throw when input data passed downstream from the api input is in an invalid format
    /// </summary>
    [Serializable]
    public class BadRequestException : Exception
    {
        protected BadRequestException(SerializationInfo info, StreamingContext context) : base(info, context) { }

        public BadRequestException(string message) : base(message) { }
    }
}
