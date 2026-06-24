import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface FeedItem {
  id: string;
  title: string;
  description?: string;
  time: string | Date;
  icon?: React.ReactNode;
  color?: string;
}

interface ActivityFeedProps {
  items: FeedItem[];
  className?: string;
  maxItems?: number;
}

export function ActivityFeed({ items, className, maxItems = 10 }: ActivityFeedProps) {
  const displayed = items.slice(0, maxItems);

  if (!displayed.length) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-gray-500 text-sm", className)}>
        No recent activity
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {displayed.map((item, i) => (
        <div key={item.id} className="flex gap-3 py-3 border-b border-gray-800/50 last:border-0 group">
          <div className="relative flex-shrink-0 mt-0.5">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm", item.color ?? "bg-gray-800 text-gray-400")}>
              {item.icon ?? "•"}
            </div>
            {i < displayed.length - 1 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-full bg-gray-800" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{item.title}</p>
            {item.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>}
            <p className="text-xs text-gray-600 mt-1">{timeAgo(item.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
