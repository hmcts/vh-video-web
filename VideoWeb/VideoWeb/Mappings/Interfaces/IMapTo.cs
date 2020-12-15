namespace VideoWeb.Mappings
{
    public interface IMapTo<out TOut, in TIn>
    {
        TOut Map(TIn input);
    }
    public interface IMapTo<out TOut, in TIn1, in TIn2>
    {
        TOut Map(TIn1 input1, TIn2 input2);
    }
    public interface IMapTo<out TOut, in TIn1, in TIn2, in TIn3>
    {
        TOut Map(TIn1 input1, TIn2 input2, TIn3 input3);
    }
    public interface IMapTo<out TOut, in TIn1, in TIn2, in TIn3, in TIn4>
    {
        TOut Map(TIn1 input1, TIn2 input2, TIn3 input3, TIn4 input4);
    }
    public interface IMapTo<out TOut, in TIn1, in TIn2, in TIn3, in TIn4, in TIn5>
    {
        TOut Map(TIn1 input1, TIn2 input2, TIn3 input3, TIn4 input4, TIn5 input5);
    }
}
