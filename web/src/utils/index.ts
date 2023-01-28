/**
 * The reason this is not the same as the server `getEnv` function is
 * because Vite requires (in prod) that you use the full
 * import.meta.env.ENV_NAME instead of import.meta.env[ENV_NAME] since
 * the later will not work in prod
*/
export const getEnv = (env: string | undefined, name: string) => {
    if (!env) {
        throw new Error(`${name} env is not defined`)
    }
    return env;
}

export const isProd = () => {
    return import.meta.env.PROD || getEnv(import.meta.env.VITE_APP_ENV, "VITE_APP_ENV") === "vercel"
}