import { getComments, getPost } from './api';

addEventListener('install', () => {
  // @ts-expect-error
  skipWaiting();
});

export const match = (request: Request) => {
  const url = new URL(request.url);
  return url.pathname.match(/target((\/(index(\.html?)?)?)?|(\.html?)?)$/) && !url.search.includes('fallback=1');
};

export const onResponse = (response: Response) => {
  console.log('onResponse', response);
};

export const post = getPost;

export const comments = getComments;
