using System;

namespace VideoWeb.EventHub.Exceptions;

public class UnexpectedEventOrderException(CallbackEvent callbackEvent, Exception innerException)
    : Exception("Event received in an unexpected order", innerException)
{
    public CallbackEvent CallbackEvent { get; } = callbackEvent;
}
