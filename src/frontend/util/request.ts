import axios from 'axios';
import { environment } from '../../shared/environment';
import { FindResult } from '../../shared/find-result';

class RequestService {

  private readonly $http = axios.create({
    baseURL: environment.backendUrl,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  async getProcesState(id: string) {
    return this.$http.get<
      FindResult
      | { error: string }
      | { text: string }
    >(`/status/${id}`);
  }

  async startFileDuplicationSearch(body: {
    recursive: boolean;
    path: string;
  }) {
    return this.$http.post<{ id: string }>('', body);
  }

  async deleteFile(filePath: string) {
    const query = new URLSearchParams({
      path: filePath,
    });

    return this.$http.delete('/file', {
      params: query,
    });
  }

}

export const requestService = new RequestService();
