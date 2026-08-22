import { Toaster as HotToaster } from "react-hot-toast";

/** Mount once at the app root. Call `toast.success()/error()` anywhere. */
export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#10142c",
          color: "#fff",
          fontSize: "14px",
          borderRadius: "12px",
        },
      }}
    />
  );
}