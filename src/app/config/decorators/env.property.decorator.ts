// import { Flags, Schema } from 'yup';
//
// export type EnvPropertyMetadata<
//   TProperty,
//   // TPropertySchema extends Schema<TProperty>,
//   TPropertySchema extends Schema<TProperty, TContext, TDefault, TFlags>,
//   TContext,
//   TDefault,
//   TFlags extends Flags,
//   TEnvironmentVariableName extends string,
// > = {
//   enironmentVariableName: TEnvironmentVariableName;
//   schema: TPropertySchema;
//   // schema: Schema<TProperty>;
// };
//
// // type EnvPropertiesMetadata<
// //   TProperty,
// //   TPropertySchema extends Schema<TProperty, TContext, TDefault, TFlags>,
// //   TContext,
// //   TDefault,
// //   TFlags extends Flags,
// //   TEnvironmentVariableName extends string,
// // > = {
// //   [k: string]: unknown;
// // };
//
// type EnvPropertiesMetadata<
//   TProperty,
//   TPropertySchema extends Schema<TProperty, TContext, TDefault, TFlags>,
//   TContext,
//   TDefault,
//   TFlags extends Flags,
//   TEnvironmentVariableName extends string,
// > = Record<
//   string | symbol,
//   EnvPropertyMetadata<
//     TProperty,
//     TPropertySchema,
//     TContext,
//     TDefault,
//     TFlags,
//     TEnvironmentVariableName
//   >
// >;
//
// const envPropertyMetadataKeySymbol = Symbol(`decorator__${envProperty.name}`);
//
// // type EnvPropertyDecoratedObject<TInstance extends object> = TInstance & {
// //   [envPropertyMetadataKeySymbol]: EnvPropertiesMetadata | undefined;
// // };
//
// type EnvPropertyDecoratedObject<
//   TProperty,
//   TPropertySchema extends Schema<TProperty, TContext, TDefault, TFlags>,
//   TContext,
//   TDefault,
//   TFlags extends Flags,
//   TEnvironmentVariableName extends string,
// > = {
//   [envPropertyMetadataKeySymbol]:
//     | EnvPropertiesMetadata<
//         TProperty,
//         TPropertySchema,
//         TContext,
//         TDefault,
//         TFlags,
//         TEnvironmentVariableName
//       >
//     | undefined;
// };
//
// type TypedPropertyDecorator<
//   TTarget extends object,
//   TPropertyName extends string | symbol,
// > = (target: TTarget, propertyKey: TPropertyName) => void;
//
// export function envProperty<
//   // TProperty,
//   TProperty extends TTarget[TPropertyName],
//   TTarget extends object,
//   TPropertyName extends string & keyof TTarget,
//   TSchema extends Schema<TProperty, TContext, TDefault, TFlags>,
//   TContext,
//   TDefault,
//   TFlags extends Flags,
//   TEnvironmentVariableName extends string,
// >(
//   metadata: EnvPropertyMetadata<
//     TProperty,
//     TSchema,
//     TContext,
//     TDefault,
//     TFlags,
//     TEnvironmentVariableName
//   >,
// ): TypedPropertyDecorator<TTarget, TPropertyName> {
//   return function envPropertyDecorator(target, propertyKey) {
//     const decorated = target as EnvPropertyDecoratedObject<
//       TProperty,
//       TSchema,
//       TContext,
//       TDefault,
//       TFlags,
//       TEnvironmentVariableName
//     >;
//     let allMetadata = decorated[envPropertyMetadataKeySymbol];
//     if (allMetadata === undefined) {
//       allMetadata = {};
//       decorated[envPropertyMetadataKeySymbol] = allMetadata;
//     }
//     allMetadata[propertyKey] = metadata;
//   };
// }
//
// // export abstract class AbstractEnvPropertyDecoractedObject
// //   implements EnvPropertyDecoratedObject
// // {
// //   constructor() {}
// //   abstract validateEnvProperties(): void;
// // }
//
// // export function validateEnvProperty<
// //   // TProperty,
// //   TProperty extends TTarget[TPropertyName],
// //   TPropertyName extends string & keyof TTarget,
// //   TTarget extends object,
// //   TSchema extends Schema<TProperty, TContext, TDefault, TFlags>,
// //   TContext,
// //   TDefault,
// //   TFlags extends Flags,
// //   TEnvironmentVariableName extends string,
// // >(
// //   target: EnvPropertyDecoratedObject<
// //     TProperty,
// //     TSchema,
// //     TContext,
// //     TDefault,
// //     TFlags,
// //     TEnvironmentVariableName
// //   >,
// //   propertyKey: TPropertyName,
// //   env: Record<string, unknown>,
// // ) {
// //   const metadata = target[envPropertyMetadataKeySymbol]?.[propertyKey];
// //   if (!metadata) {
// //     throw new Error(
// //       `could not find envProperty metadata for ${String(propertyKey)}`,
// //     );
// //   }
// //   // return await metadata.schema.validate(
// //   //   env[metadata.enironmentVariableName],
// //   //   {},
// //   // );
// //   return metadata.schema.validateSync(env[metadata.enironmentVariableName]);
// // }
