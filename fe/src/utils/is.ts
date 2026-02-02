/**
 * 타입 체크를 위한 유틸리티 함수 생성자
 * @param type - 체크할 타입 문자열
 * @returns 타입 체크 함수
 */
const is = (type: string) => (v: unknown) => typeof v === type;

/**
 * 값의 타입을 판별하는 유틸리티 객체
 */

const IS = {
  string: is('string'),
  function: is('function'),
  object: (v: unknown) => v !== null && is('object')(v) && !Array.isArray(v),
  boolean: is('boolean'),
  number: (v: unknown) => is('number')(v) && !Number.isNaN(v),
  numeric: (v: unknown) =>
    IS.number(v) || (IS.string(v) && (v as string).trim() !== '' && !Number.isNaN(Number(v))),
  array: Array.isArray,
  null: (v: unknown) => v === null,
  undefined: (v: unknown) => v === undefined,
  nil: (v: unknown) => IS.null(v) || IS.undefined(v),
  form: (v: unknown) => v instanceof FormData,
  date: (v: unknown) => v instanceof Date,
};

export default IS;
