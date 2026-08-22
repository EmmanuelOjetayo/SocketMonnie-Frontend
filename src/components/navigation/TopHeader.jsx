import { Bell, UserCheck, Handshake } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/utils/cn";
import { ROUTES } from "@/constants/routes";
import { markAllNotificationsRead } from "@/services/notifications";


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function TopHeader({
  variant = "plain",
  user,
  unreadCount = 0,
  className,
}) {
  const navigate = useNavigate();
  const isBrand = variant === "brand";

  const firstName = user?.fullName?.split(" ")[0] ?? "User";
  
  // Format Reg ID using _id.substring(0, 8)
  const regNumber = 
    user?.referralCode || 
    user?._id?.substring(0, 8)

  const greeting = getGreeting();
  async function handleOpenNotifications() {
  try {
    if (unreadCount > 0) {
      await markAllNotificationsRead();
    }
  } catch (err) {
    console.error(err);
  }

  navigate(ROUTES.NOTIFICATIONS);
}

  if (!isBrand) {
    return (
      <header className={cn("flex items-center justify-between px-5 py-3 bg-[#F8FAFC] text-[#090f24] border-b border-[#dee3f9]/50", className)}>
        <h1 className="text-base font-bold">Dashboard</h1>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "relative text-white px-5 pt-4 pb-7 rounded-b-[24px] shadow-md",
        className
      )}
       style={{
        background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
      }}
    >
      {/* Top Greeting Header with Handshake Icon */}
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <h1 className="text-lg font-bold tracking-tight text-white">Welcome Back</h1>
        <Handshake className="size-5 text-[#bdc8f3]" />
      </div>

      {/* Profile Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative size-10 rounded-full overflow-hidden border-2 border-[#5b76e1] bg-[#1d2d6d] shrink-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={firstName} className="size-full object-cover" />
            ) : (
              <div 
                className="flex size-full items-center justify-center font-bold text-sm text-white"
                style={{ backgroundColor: "#3b5bdb" }}
              >
                {firstName.charAt(0)}
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex flex-col">
            <span className="text-[11px] font-normal text-[#ffffff] leading-tight">{greeting}</span>
            <span className="text-sm font-bold text-white tracking-wide leading-snug">{user?.fullName || firstName}</span>
            <div className="flex items-center gap-1 text-[10px] text-[#ffffff]/80 mt-0.5">
              <UserCheck className="size-2.5 text-[#ffffff] font-bold" />
              <span>Reg Number: {regNumber}</span>
            </div>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="p-2 rounded-full bg-[#1d2d6d]/60 border border-[#3b5bdb]/40 hover:bg-[#3b5bdb]/30 transition-colors"
          >
            <Bell className="size-4 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 ring-2 ring-[#090f24]" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}