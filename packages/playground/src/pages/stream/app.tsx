import { Use, useStreamChunks } from "@react-swsr/runtime";
import { Skeleton } from "../../components/skeleton";
import { random, random2 } from "./worker";

export default () => {
  const chunks = useStreamChunks<{ random: number; random2: number }>() || {
    random: random(),
    random2: random2(),
  };

  return (
    <>
      <h1>SWSR Demo</h1>
      <button onClick={() => console.log("click stream")}>console</button>
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
        {(random) => {
          return <p>Random2: {random}</p>;
        }}
      </Use>

      {new Array(48).fill(0).map((_, index) => (
        <Skeleton key={index} width={300} />
      ))}
      <div>placeholder placeholder placeholder placeholder placeho</div>
    </>
  );
};
