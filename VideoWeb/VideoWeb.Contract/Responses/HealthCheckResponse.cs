using System.Collections;

namespace VideoWeb.Contract.Responses
{
    public class HealthCheckResponse
    {
        public HealthCheckResponse()
        {
            BookingsApiHealth = new HealthCheck();
            UserApiHealth = new HealthCheck();
            VideoApiHealth = new HealthCheck();
            EventsCallbackHealth = new HealthCheck();
        }
        public HealthCheck BookingsApiHealth { get; set; }
        public HealthCheck UserApiHealth { get; set; }
        public HealthCheck VideoApiHealth { get; set; }
        public HealthCheck EventsCallbackHealth { get; set; }

    }

    public class HealthCheck
    {
        public bool Successful { get; set; }
        public string ErrorMessage { get; set; }
        public IDictionary Data { get; set; }
    }
}