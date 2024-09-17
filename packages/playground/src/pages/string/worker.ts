const sleep = (x: number) =>
  new Promise((resolve, reject) => {
    const random = Math.floor(Math.random() * 10000);
    setTimeout(
      random > 3000
        ? resolve
        : () => reject(new Error(`Rejected by ${random}`)),
      x,
    );
  });

export const random = () =>
  sleep(500).then(() => fetch('/random').then((response) => response.json()));

export const random2 = () =>
  sleep(100).then(() => fetch('/random').then((response) => response.json()));
