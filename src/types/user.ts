export interface User {
  id: string;
  email: string;
  name: string;
  username: string | null;
  image: string | null;
  xp: number;
  petHappiness: number;
}
