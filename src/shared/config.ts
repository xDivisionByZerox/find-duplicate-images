export default {
  getSocketEnpoint(id: string) {
    return `/socket/${id}`;
  },
  backendPort: 3000,
  backendDomain: 'http://localhost',
}
