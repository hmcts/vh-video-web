using System;
using VideoApi.Contract.Responses;
using VideoWeb.Common.Models;

namespace VideoWeb.Common.Caching;

public static class TelephoneParticipantCacheMapper
{
    public static TelephoneParticipant MapTelephoneToCacheModel(TelephoneParticipantResponse response)
    {
        return new TelephoneParticipant
        {
            Id = response.Id,
            Connected = true,
            PhoneNumber = response.PhoneNumber,
            Room = Enum.Parse<RoomType>(response.Room.ToString())
        };
    }
}
