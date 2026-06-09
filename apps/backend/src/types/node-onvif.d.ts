declare module 'node-onvif' {
  export class OnvifDevice {
    constructor(options: { xaddr: string; user?: string; pass?: string });
    init(): Promise<void>;
    services: {
      ptz: {
        continuousMove(params: any): Promise<any>;
        stop(params: any): Promise<any>;
      };
      device: {
        getDeviceInformation(): Promise<any>;
      };
    };
    getCurrentProfile(): any;
  }
}
