import Link from "next/link";

export default function NotFound() {
  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[50vh]">
      <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
      <p className="text-gray-600 mb-6">The product you are looking for does not exist or has been removed.</p>
      <Link href="/dashboard/products" className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
        Back to Products
      </Link>
    </div>
  );
}
