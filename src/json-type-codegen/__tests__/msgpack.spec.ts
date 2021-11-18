import {t} from '../../json-type/type';
import {EncodingPlan} from '../msgpack';

test('...', () => {
  const type = t.Object({
    fields: [
      t.Field('aaa', t.Object({
        fields: [
          t.Field('bbb', t.str),
          t.Field('ccc', t.num),
          t.Field('ddd', [t.num, t.str]),
          t.Field('eee', t.bool),
          t.Field('fff', t.nil),
        ],
      })),
    ],
  });

  console.log(JSON.stringify(type, null, 4));
  const plan = new EncodingPlan();

  plan.createPlan(type);

  console.log(plan);

});
