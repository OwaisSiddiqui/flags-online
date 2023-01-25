export const getEnv = (env: string | undefined, name: string) => {
    if (!env) {
        throw new Error(`${name} env is not defined`)
    }
    return env;
}