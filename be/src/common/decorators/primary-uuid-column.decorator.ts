import { PrimaryColumn, PrimaryColumnOptions } from 'typeorm';

export const uuidTransformer = {
  to: (value: string) => (value ? Buffer.from(value.replaceAll('-', ''), 'hex') : value),
  from: (value: Buffer) =>
    value ? value.toString('hex').replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, '$1-$2-$3-$4-$5') : value,
};

/**
 * MySQL BINARY(16) 전용 UUID PK 데코레이터
 */
export function PrimaryUuidColumn(options?: PrimaryColumnOptions): PropertyDecorator {
  return PrimaryColumn({
    type: 'binary',
    length: 16,
    transformer: uuidTransformer,
    ...options, // 추가적인 옵션(name 등)이 있다면 덮어씌움
  });
}

/**
 * 일반 외래키 컬럼용 데코레이터 (PK는 아니지만 BINARY(16) UUID인 경우)
 */
export function UuidColumn(options?: any): PropertyDecorator {
  const { Column } = require('typeorm'); // 실행 시점에 Column 로드
  return Column({
    type: 'binary',
    length: 16,
    transformer: uuidTransformer,
    ...options,
  });
}
