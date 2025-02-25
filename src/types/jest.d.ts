import { jest } from '@jest/globals';

type FetchMock = jest.Mock<Promise<Response>, [input: RequestInfo | URL, init?: RequestInit]>;

declare global {
  // eslint-disable-next-line no-var
  var fetch: FetchMock;
}

export {};
