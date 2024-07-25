using BookingsApi.Contract.V1.Enums;
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

        public JudicialParticipantResponseBuilder WithUsername(string username)
        {
            _participant.With(x => x.Email = username);
            return this;
        }

        public JudicialParticipantResponseBuilder WithInterpreterLanguage(string code, string value, InterpreterType type)
        {
            _participant.With(x => x.InterpreterLanguage = new InterpreterLanguagesResponse
            {
                Code = code,
                Value = value,
                Type = type
            });
            return this;
        }

    public JudiciaryParticipantResponse Build()
        {
            return _participant.Build();
        }
    }
}
