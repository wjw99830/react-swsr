import { IComment, IPost } from "../../typings/json-placeholder";

const getRandomIntByRange = (range: number) =>
  Math.floor(Math.random() * range);

const sleep = (x: number) =>
  new Promise((resolve, reject) => {
    const random = getRandomIntByRange(10000);
    setTimeout(
      random > 1 ? resolve : () => reject(new Error(`Random rejection`)),
      x
    );
  });

const getPostIdByRequest = (req: Request) =>
  new URL(req.url).searchParams.get("id");

export const getPost = (req: Request) =>
  sleep(getRandomIntByRange(1000)).then(() =>
    fetch(
      `https://jsonplaceholder.typicode.com/posts/${getPostIdByRequest(req)}`
    ).then((response) => response.json() as Promise<IPost>)
  );

export const getComments = (req: Request) =>
  sleep(getRandomIntByRange(1000)).then(() =>
    fetch(
      `https://jsonplaceholder.typicode.com/posts/${getPostIdByRequest(
        req
      )}/comments`
    ).then((response) => response.json() as Promise<IComment[]>)
  );
