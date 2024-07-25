namespace VideoWeb.Contract.Responses
{
    public class InterpreterLanguageResponse
    {
        public string Code { get; set; }
        public string Description { get; set; }
        public InterpreterType Type { get; set; }
    }
    
    public enum InterpreterType
    {
        Sign = 1,
        Verbal = 2
    }
}
