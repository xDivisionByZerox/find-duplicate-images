class Environment {

  readonly backendPort = 3000;
  readonly backendDomain = 'http://localhost';

  readonly backendUrl = `${this.backendDomain}:${this.backendPort}`;

  getSocketEnpoint(id: string) {
    return `/socket/${id}`;
  }

}

export const environment = new Environment();
