export enum DeploymentEnvironment {
    DEV = 'dev',
    STAGING = 'staging',
    PRODUCTION = 'production',
}

export interface ServerStats {
    environment: DeploymentEnvironment,
}