export enum DeploymentEnvironment {
    STAGING = 'staging',
    PRODUCTION = 'production',
}

export interface ServerStats {
    environment: DeploymentEnvironment,
}