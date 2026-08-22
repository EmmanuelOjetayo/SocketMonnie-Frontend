import { useState, useMemo } from "react";
import { 
  ArrowLeft, 
  CalendarCheck, 
  Coins, 
  Wallet, 
  Bell, 
  CheckCircle2 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingState } from "@/components/feedback/LoadingState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { getNotifications, markNotificationRead } from "@/services/notifications";
import { formatNaira } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

const FILTER_TABS = ["All", "Savings", "Socket Score", "Loan"];

// Helper function to format MongoDB createdAt timestamps
function formatNotificationDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Helper function to format relative time for card footer (e.g. "10:30 AM" or "2 mins ago")
function formatNotificationTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Dynamic icon router based on notification type
function getNotificationIcon(type, title) {
  const lowerTitle = (title || "").toLowerCase();
  const lowerType = (type || "").toLowerCase();

  if (lowerTitle.includes("repayment") || lowerTitle.includes("loan") || lowerType === "loan") {
    return <CalendarCheck className="size-5 text-indigo-600" />;
  }
  if (lowerTitle.includes("savings") || lowerTitle.includes("deposit") || lowerType === "savings") {
    return <Coins className="size-5 text-indigo-600" />;
  }
  if (lowerTitle.includes("withdrawal") || lowerTitle.includes("wallet")) {
    return <Wallet className="size-5 text-indigo-600" />;
  }
  return <CheckCircle2 className="size-5 text-indigo-600" />;
}

export function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const { data, isLoading } = useAsync(getNotifications, []);

  const notificationsList = data?.notifications || data?.data || [];

  async function handleNotificationClick(notification) {
    if (!notification.read && (notification._id || notification.id)) {
      await markNotificationRead(notification._id || notification.id).catch(() => {});
    }

    const payload = notification.data || {};
    if (payload.token) {
      navigate(`/guarantor/verify/${payload.token}`);
      return;
    }

    if (payload.action?.startsWith("withdrawal_")) {
      navigate(ROUTES.SAVINGS_WITHDRAW_SUCCESS, {
        state: {
          amount: payload.amount,
          fee: payload.fee,
          totalDeducted: payload.totalDeducted,
          destinationBank: payload.destinationBank,
          reference: payload.reference,
          status: payload.status,
          rejectionReason: payload.rejectionReason,
          isPending: payload.status === "pending",
          date: notification.createdAt,
        },
      });
    }
  }

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return notificationsList;
    return notificationsList.filter(
      (n) => n.type?.toLowerCase() === activeTab.toLowerCase()
    );
  }, [notificationsList, activeTab]);

  // Group notifications dynamically into "Today", "Yesterday", or exact date string (e.g., "07 Nov, 2026")
  const groupedNotifications = useMemo(() => {
    const groups = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredItems.forEach((item) => {
      const itemDate = new Date(item.createdAt || item.date);
      let groupKey = "";

      if (isNaN(itemDate.getTime())) {
        groupKey = "Earlier";
      } else {
        const itemDay = new Date(
          itemDate.getFullYear(),
          itemDate.getMonth(),
          itemDate.getDate()
        );

        if (itemDay.getTime() === today.getTime()) {
          groupKey = "Today";
        } else if (itemDay.getTime() === yesterday.getTime()) {
          groupKey = "Yesterday";
        } else {
          // Format specific dates like "07 Nov, 2026"
          groupKey = itemDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });

    return groups;
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-10">
      {/* BRAND BLUE HEADER WITH INTEGRATED FILTER TABS */}
      <header
        className="relative rounded-b-4xl px-5 pb-12 pt-6 text-white shadow-sm"
        style={{
          background: "linear-gradient(180deg, #3b5bdb 0%, #2b44b8 60%, #1d2d6d 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="size-6 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white text-center flex-1 pr-6">
            Notification
          </h1>
        </div>

        {/* PILL FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1d2d6d] text-white shadow-inner"
                    : "bg-white text-gray-800 hover:bg-white/90"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </header>

      {/* NOTIFICATION CONTENT CONTAINER */}
      <div className="px-5 mt-6 space-y-6 max-w-md mx-auto">
        {isLoading ? (
          <LoadingState rows={4} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            description={
              activeTab === "All"
                ? "No new notifications."
                : `No notifications under ${activeTab}.`
            }
          />
        ) : (
          Object.entries(groupedNotifications).map(([groupName, items]) => {
            if (!items.length) return null;
            return (
              <div key={groupName} className="space-y-3">
                <h2 className="text-xs font-bold text-gray-900">{groupName}</h2>
                <div className="space-y-3">
                  {items.map((n) => {
                    const isDebit = n.isDebit || n.type === "withdrawal";
                    const isUnread = n.unread ?? !n.read;
                    const formattedTime = n.createdAt
                      ? formatNotificationTime(n.createdAt)
                      : n.time;

                    return (
                      <div
                        key={n.id || n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-start gap-3 relative ${n.data?.token || n.data?.action?.startsWith("withdrawal_") ? "cursor-pointer hover:border-indigo-200" : ""}`}
                      >
                        {/* ICON BUBBLE */}
                        <div className="size-11 rounded-full bg-indigo-50/80 border border-indigo-100 flex items-center justify-center shrink-0">
                          {getNotificationIcon(n.type, n.title)}
                        </div>

                        {/* CONTENT DETAILS */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-900 leading-tight">
                              {n.title}
                            </h3>
                            {/* UNREAD GREEN DOT */}
                            {isUnread && (
                              <span className="size-2 rounded-full bg-teal-400 shrink-0" />
                            )}
                          </div>

                          <p className="text-[11px] text-gray-500 leading-tight">
                            {n.message || n.description}
                          </p>

                          {n.subText && (
                            <p className="text-[11px] font-bold text-gray-900 pt-0.5">
                              {n.subText}
                            </p>
                          )}

                          <p className="text-[10px] text-gray-400 pt-1">
                            {formattedTime}
                          </p>
                        </div>

                        {/* HIGHLIGHTED AMOUNT (IF APPLICABLE) */}
                        {n.amount && (
                          <div
                            className={`text-xs font-bold shrink-0 self-center ${
                              isDebit ? "text-red-600" : "text-emerald-500"
                            }`}
                          >
                            {isDebit ? "-" : ""}{formatNaira(n.amount)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}