declare module 'midtrans-client' {
  interface CoreApiConfig {
    isProduction: boolean
    serverKey:    string
    clientKey:    string
  }

  class CoreApi {
    constructor(config: CoreApiConfig)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    charge(params: Record<string, unknown>): Promise<Record<string, any>>
  }

  export { CoreApi }
}
