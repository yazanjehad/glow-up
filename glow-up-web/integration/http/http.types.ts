export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE';

  export interface HttpResponse<T>{
  data: T;
  errCode: number;
  errMessage: string;
  IsSuccess: boolean;
  isAuthorized: boolean;
  
  } 
export interface HttpRequestConfig<TBody = unknown> {
  url: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  authToken?: string;
}
