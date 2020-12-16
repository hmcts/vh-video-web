namespace VideoWeb.Mappings
{
    public interface IMapTo<in TIn1, out TOut>
    {
        TOut Map(TIn1 input);
    }
    public interface IMapTo<in TIn1, in TIn2, out TOut>
    {
        TOut Map(TIn1 input1, TIn2 input2);
    }
    public interface IMapTo<in TIn1, in TIn2, in TIn3, out TOut>
    {
        TOut Map(TIn1 input1, TIn2 input2, TIn3 input3);
    }
    public interface IMapTo<in TIn1, in TIn2, in TIn3, in TIn4, out TOut>
    {
        TOut Map(TIn1 input1, TIn2 input2, TIn3 input3, TIn4 input4);
    }
    public interface IMapTo<in TIn1, in TIn2, in TIn3, in TIn4, in TIn5, out TOut>
    {
        TOut Map(TIn1 input1, TIn2 input2, TIn3 input3, TIn4 input4, TIn5 input5);
    }
}
