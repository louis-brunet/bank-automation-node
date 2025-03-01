import { configureCaisseDEpargne, Env } from './config';

async function main() {
    const env = new Env();
    const config = await configureCaisseDEpargne(env);

    console.log({ config });
}

main()
    .then(() => console.log('Done'))
    .catch(console.error);
