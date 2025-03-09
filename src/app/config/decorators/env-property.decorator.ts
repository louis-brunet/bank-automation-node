import { Schema } from 'yup';

type EnvPropertyMetadata<TPropertyName extends string, TProperty> = {
  name: TPropertyName;
  schema: Schema<TProperty>;
};
type EnvPropertiesMetadata = Record<
  string | symbol,
  EnvPropertyMetadata<string, unknown>
>;

const envPropertyMetadataKeySymbol = Symbol(`decorator__${envProperty.name}`);

type EnvPropertyDecoratedObject<TInstance extends object> = TInstance & {
  [envPropertyMetadataKeySymbol]: EnvPropertiesMetadata | undefined;
};

export function envProperty<TProperty>(
  metadata: EnvPropertyMetadata<string, TProperty>,
): PropertyDecorator {
  return function envPropertyDecorator(target, propertyKey) {
    const decorated = target as EnvPropertyDecoratedObject<typeof target>;
    let allMetadata = decorated[envPropertyMetadataKeySymbol];
    if (allMetadata === undefined) {
      allMetadata = {};
      decorated[envPropertyMetadataKeySymbol] = allMetadata;
    }
    allMetadata[propertyKey] = metadata;
  };
}

export function validateEnvProperty(
  target: EnvPropertyDecoratedObject<object>,
  propertyKey: string | symbol,
  env: Record<string, unknown>,
) {
  const metadata = target[envPropertyMetadataKeySymbol]?.[propertyKey];
  if (!metadata) {
    throw new Error(
      `could not find envProperty metadata for ${String(propertyKey)}`,
    );
  }
  return metadata.schema.validateSync(env[metadata.name]);
}
