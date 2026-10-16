import Image from "next/image";

export default function SuperAdminDashboardPage() {
  return (
    <div className="flex items-center justify-center bg-gray-50 overflow-hidden">
      <Image
        src="/logo.png"
        alt="Logo"
        width={200}
        height={200}
        className="h-auto w-[200px] opacity-50 p-8 pt-[25%]"
        priority
      />
    </div>
  );
}
