import { useState, useEffect } from "react";
import { Bell, UserCheck, Handshake, ArrowLeft } from "lucide-react";
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

/**
 * The app's page header.
 *
 *   variant="brand" → the dashboard greeting hero (avatar + notification bell)
 *   variant="page"  → a branded page header (back button + title + optional
 *                     pill row) — the same treatment the Savings page uses
 *   variant="plain" → a light header bar
 *
 * `title` / `subtitle` / `showBack` are honoured by every variant, so a page
 * never has to hand-roll its own header.
 */
export function TopHeader({
  variant = "plain",
  title,
  subtitle,
  showBack = false,
  user,
  unreadCount = 0,
  className,
  children,
}) {
  const navigate = useNavigate();
  const isBrand = variant === "brand";
  const isPage = variant === "page";

  const firstName = user?.fullName?.split(" ")[0] ?? "User";
  const [avatarError, setAvatarError] = useState(false);

  // Reset the broken-image flag whenever a different picture is loaded
  // (onboarding complete, login, or profile update).
  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatarUrl]);
  
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

  if (isPage) {
    return (
      <header
        className={cn(
          "relative px-5 pt-4 pb-7 rounded-b-[24px] shadow-md text-white",
          className
        )}
        style={{
          background: "linear-gradient(180deg, #5B76E1 0%, #32417B 100%)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="size-5 text-white" />
            </button>
          ) : (
            <div className="w-5 shrink-0" />
          )}

          <div className="min-w-0 text-center">
            <h1 className="text-base font-bold tracking-tight text-white truncate">
              {title || "Dashboard"}
            </h1>
            {subtitle && (
              <p className="text-[10px] font-medium text-white/70 truncate">
                {subtitle}
              </p>
            )}
          </div>

          <div className="w-5 shrink-0" />
        </div>

        {children}
      </header>
    );
  }

  if (!isBrand) {
    return (
      <header className={cn("flex items-center justify-between px-5 py-3 bg-[#F8FAFC] text-[#090f24] border-b border-[#dee3f9]/50", className)}>
        {showBack ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="-ml-1 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}

        <h1 className="text-base font-bold">{title || "Dashboard"}</h1>

        {showBack ? <div className="w-6" /> : null}
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
            {user?.avatarUrl && !avatarError ? (
              <img
                src={user.avatarUrl}
                alt={firstName}
                className="size-full object-cover"
                onError={() => setAvatarError(true)}
              />
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