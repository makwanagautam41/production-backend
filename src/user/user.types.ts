export interface User {
  _id: string;
  name: string;
  email: string;
  password: string;
  profileImage: {
    public_id: string | null;
    secure_url: string | null;
  };
}
