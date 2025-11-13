import { Task } from "@/types/history";

type TaskListProps = {
  tasks: Task[];
  title: string;
};

export default function TaskList({ tasks, title }: TaskListProps) {
  return (
    <div className="w-full border border-gray-700 rounded-xl p-4 bg-[#151515] space-y-3">
      <h2 className="font-semibold text-lg text-gray-100">{title}</h2>
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks in this range.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map(task => (
            <li
              key={task.id}
              className="flex justify-between items-center px-3 py-2 rounded-lg bg-[#1f1f1f] text-sm"
            >
              <span className="text-gray-100">{task.title}</span>
              <span className="text-xs text-gray-500">
                {new Date(task.completedAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
