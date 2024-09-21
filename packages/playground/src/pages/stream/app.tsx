import "./app.css";
import { Use, useStreamChunks } from "@react-swsr/runtime";
import { Skeleton } from "../../components/skeleton";
import { getPost, getComments } from "./worker";
import { IComment, IPost } from "../../typings/json-placeholder";

export default () => {
  const chunks = useStreamChunks<{
    getPost: IPost;
    getComments: IComment[];
  }>() || {
    getPost: getPost(new Request(location.href)),
    getComments: getComments(new Request(location.href)),
  };

  return (
    <>
      <header>
        <h1>JSON Placeholder</h1>
      </header>

      <main>
        <section>
          <h2>Post</h2>
          <hr />

          <Use
            chunk={chunks.getPost}
            pending={
              <>
                <Skeleton Tag="h2" width={400} height={36} />
                <Skeleton Tag="p" width="100%" />
                <Skeleton Tag="p" width="100%" />
              </>
            }
            rejected={(error) => <p>Failed to fetch post: {error}</p>}
          >
            {(post) => (
              <>
                <h2>{post.title}</h2>
                <p>{post.body}</p>
              </>
            )}
          </Use>
        </section>

        <section>
          <h2>Comments</h2>
          <hr />

          <Use
            chunk={chunks.getComments}
            pending={new Array(5).fill(0).map((_, index) => (
              <section key={index} className="comment">
                <Skeleton Tag="p" className="comment-name" width={256} />
                <Skeleton Tag="p" className="comment-body" width="100%" />
                <Skeleton Tag="p" className="comment-body" width="100%" />
              </section>
            ))}
            rejected={(error) => <p>Failed to fetch comments: {error}</p>}
          >
            {(comments) =>
              comments.map((it) => (
                <section key={it.id} className="comment">
                  <p className="comment-name">{it.name}</p>
                  <p className="comment-body">{it.body}</p>
                </section>
              ))
            }
          </Use>
        </section>
      </main>
    </>
  );
};
