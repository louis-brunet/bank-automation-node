import { object, ObjectShape } from 'yup';

export class Env {
    private readonly _env: Record<string, unknown>;

    constructor(env?: Record<string, unknown>) {
        this._env = env ?? process.env;
    }

    public async validate<T extends ObjectShape>(schema: T) {
        return object(schema).validate(this._env, {
            stripUnknown: true,
        });
    }
}
