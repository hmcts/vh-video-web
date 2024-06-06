using BookingsApi.Contract.V1.Requests.Enums;
using BookingsApi.Contract.V1.Responses;
using FizzWare.NBuilder;

namespace VideoWeb.UnitTests.Builders
{
    public class JudicialParticipantResponseBuilder
    {
        private readonly ISingleObjectBuilder<JudiciaryParticipantResponse> _participant;

        public JudicialParticipantResponseBuilder(bool IsJudge)
        {
            _participant = Builder<JudiciaryParticipantResponse>.CreateNew()
                .With(x => x.HearingRoleCode = IsJudge
                    ? JudiciaryParticipantHearingRoleCode.Judge
                    : JudiciaryParticipantHearingRoleCode.PanelMember);
        }
        
        public JudiciaryParticipantResponse Build()
        {
            return _participant.Build();
        }
    }
}
