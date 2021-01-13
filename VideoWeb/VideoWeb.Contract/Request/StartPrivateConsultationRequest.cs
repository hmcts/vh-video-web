using System;
using System.ComponentModel.DataAnnotations;
using VideoWeb.Contract.Enums;

namespace VideoWeb.Contract.Request
{
    public class StartPrivateConsultationRequest
    {
        public Guid ConferenceId { get; set; }
        public Guid RequestedBy { get; set; }

        [EnumDataType(typeof(VirtualCourtRoomType))]
        public VirtualCourtRoomType RoomType { get; set; }
    }
}
