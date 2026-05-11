import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function UserAvatar({ name, image, size = "md", className }: UserAvatarProps) {
  return (
    <Avatar className={cn(SIZE_MAP[size], className)}>
      {image && <AvatarImage src={image} alt={name ?? "User"} />}
      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
