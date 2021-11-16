import {OpTest} from '../../op';
import {$$find} from "../../../json-pointer/codegen/$$find";
import {$$deepEqual} from "../../../json-equal/$$deepEqual";
import {compile, CompiledFunction, JavaScript} from "../../../util/codegen";
import {predicateOpWrapper} from '../util';
import type {ApplyFn} from '../types';

export const $$test = (op: OpTest): CompiledFunction<ApplyFn> => {
  const js = /* js */ `
(function(wrapper){
  var find = ${$$find(op.path)};
  var deepEqual = ${$$deepEqual(op.value)};
  return wrapper(function(doc){
    var val = find(doc);
    if (val === undefined) return ${op.not ? 'true' : 'false'};
    return ${op.not ? '!' : ''}deepEqual(val);
  });
})`;

  return {
    deps: [predicateOpWrapper] as unknown[],
    js: js as JavaScript<(...deps: unknown[]) => ApplyFn>,
  };
};

export const $test = (op: OpTest): ApplyFn => {
  const fn = $$test(op);
  const compiled = compile(fn.js)(...fn.deps);
  return compiled;
};
