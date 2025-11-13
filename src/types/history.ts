export type Evolution = {
  id: string;
  level: number;          
  form: string;          
  evolvedAt: string;      
};

// Completed tasks
export type Task = {
  id: string;
  title: string;
  completedAt: string;   
};