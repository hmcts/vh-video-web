using System;
using TechTalk.SpecFlow;
using VideoWeb.Contract.Request;

namespace VideoWeb.AcceptanceTests.Builders
{
    public class MediaEventBuilder
    {
        private const string AlertTimeKey = "alert time";
        private AddSelfTestFailureEventRequest _request;
        private SelfTestFailureReason _reason;
        private Guid _participantId;

        public MediaEventBuilder ForParticipant(Guid? participantId)
        {
            if (participantId == null)
                throw new DataMisalignedException("Participant id cannot be null.");
            _participantId = (Guid)participantId;
            return this;
        }

        public MediaEventBuilder WithReason(SelfTestFailureReason reason)
        {
            _reason = reason;
            return this;
        }

        public MediaEventBuilder WithScenarioContext(ScenarioContext scenarioContext)
        {
            scenarioContext.Add(AlertTimeKey, DateTime.Now);
            return this;
        }

        public AddSelfTestFailureEventRequest Build()
        {
            _request = new AddSelfTestFailureEventRequest()
            {
                ParticipantId = _participantId,
                SelfTestFailureReason = _reason
            };
            return _request;
        }
    }
}
