export const getEnv = (env: string | undefined, name: string) => {
    if (!env) {
        throw new Error(`${name} env is not defined`)
    }
    return env;
}

export const isProduction = () => {
    return import.meta.env.NODE_ENV === "production" || import.meta.env.VITE_APP_ENV === "vercel"
}