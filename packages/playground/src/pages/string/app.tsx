import { Use, useStringChunks } from "@react-swsr/runtime";
import { random, random2 } from "./worker";

export default () => {
  const chunks = useStringChunks<{ random: number; random2: number }>() || {
    random: random(),
    random2: random2(),
  };

  return (
    <>
      <h1>SWSR Demo</h1>
      <button onClick={() => console.log("click")}>console</button>
      <Use
        chunk={chunks.random}
        pending={<p>Random loading...</p>}
        rejected={(error) => <p>Failed to fetch random: {error}</p>}
      >
        {(random) => <p>Random: {random}</p>}
      </Use>

      <Use
        chunk={chunks.random2}
        pending={<p>Random2 loading...</p>}
        rejected={(error) => <p>Failed to fetch random: {error}</p>}
      >
        {(random) => <p>Random2: {random}</p>}
      </Use>
    </>
  );
};
