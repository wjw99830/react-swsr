const sleep = (x: number) =>
  new Promise((resolve, reject) => {
    const random = Math.floor(Math.random() * 10000);
    setTimeout(
      random > 5000
        ? resolve
        : () => reject(new Error(`Rejected by ${random}`)),
      x
    );
  });

export const random = () =>
  sleep(500).then(() =>
    fetch("/random").then((response) => response.json() as Promise<number>)
  );

export const random2 = () =>
  sleep(1000).then(() =>
    fetch("/random").then((response) => response.json() as Promise<number>)
  );
