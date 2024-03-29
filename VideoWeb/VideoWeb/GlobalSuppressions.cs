// This file is used by Code Analysis to maintain SuppressMessage
// attributes that are applied to this project.
// Project-level suppressions either have no target or are given
// a specific target and scoped to a namespace, type, member, etc.

using System.Diagnostics.CodeAnalysis;

[assembly: SuppressMessage("Critical Code Smell", "S927:parameter names should match base declaration and other partial definitions", Justification = "Name provides additional context. The generic interfaces calls `input`changing would hurt the readability of the mapper.", Scope = "namespaceanddescendants", Target = "VideoWeb.Mappings")]
[assembly: SuppressMessage("Warning Code Smell", "S1481:Remove the unused local variable", Justification = "Name provides additional context. The generic interfaces calls `input`changing would hurt the readability of the mapper.", Scope = "namespaceanddescendants", Target = "VideoWeb.Mappings.Decorators")]
