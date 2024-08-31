export const getEnv = (envName: string): string => {
  const value = process.env[envName]
  if (!value) throw new Error(`environment variable: ${envName} was not set.`)
  return value
}
