import { string } from 'yup';
import { Env } from './env';

const envSchema = {
    ACCOUNT_ID: string().required(),
    ACCOUNT_PASSWORD: string().required(),
    CHECKING_ACCOUNT: string().required(),
};

export interface ICaisseDEpargneConfig {
    accountId: string;
    accountPassword: string;
    checkingAccount: string;
}

export async function configureCaisseDEpargne(
    env: Env
): Promise<ICaisseDEpargneConfig> {
    const validated = await env.validate(envSchema);

    return {
        accountId: validated.ACCOUNT_ID,
        accountPassword: validated.ACCOUNT_PASSWORD,
        checkingAccount: validated.CHECKING_ACCOUNT,
    };
}
