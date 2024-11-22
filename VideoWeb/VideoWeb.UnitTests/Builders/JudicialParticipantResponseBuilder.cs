using BookingsApi.Contract.V2.Enums;
using BookingsApi.Contract.V2.Responses;
using FizzWare.NBuilder;

namespace VideoWeb.UnitTests.Builders
{
    public class JudicialParticipantResponseBuilder
    {
        private readonly ISingleObjectBuilder<JudiciaryParticipantResponse> _participant;

        public JudicialParticipantResponseBuilder(bool isJudge)
        {
            _participant = Builder<JudiciaryParticipantResponse>.CreateNew()
                .With(x => x.HearingRoleCode = isJudge
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
