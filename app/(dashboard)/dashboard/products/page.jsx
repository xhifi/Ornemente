import React from "react";
import Link from "next/link";
import { getProducts } from "@/data/dal/shop/products/product-actions";
import getShopSexes from "@/data/dal/shop/get-shop-sexes";
import AddProductDialog from "@/components/forms/AddProductDialog";
import DeleteProductDialog from "@/components/forms/DeleteProductDialog";

// Server Component - async function to fetch data
export default async function ProductsPage() {
  // Fetch data on the server
  const productsResult = await getProducts({}); // Pass empty object for default values
  const sexesResult = await getShopSexes();

  // Extract the data
  const products = productsResult.products || [];
  const sexes = sexesResult;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <AddProductDialog sexes={sexes} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No products found</p>
            <AddProductDialog sexes={sexes} buttonText="Add Your First Product" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-md"></div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description || "No description"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{product.sex_name || "Unspecified"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.original_price ? `₨${product.original_price.toLocaleString()}` : "N/A"}
                    </div>
                    {product.discount > 0 && <div className="text-xs text-green-600">{product.discount}% off</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.publish_status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {product.publish_status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/products/${product.id}/edit`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    <DeleteProductDialog productId={product.id} productName={product.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
