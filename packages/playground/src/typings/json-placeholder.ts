export interface IPost {
  id: number;
  title: string;
  body: string;
  userId: number;
}

export interface IUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
}

export interface IComment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}
