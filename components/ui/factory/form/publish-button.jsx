"use client";

import { useState } from "react";
import publishOrUnpublishProduct from "@/data/dal/shop/products/publish-or-unpublish-product";
import { useRouter } from "next/navigation";
import revalidatePathSSR from "@/lib/revalidate-path-ssr";

const PublishButton = ({ status, id }) => {
  const [state, setState] = useState(status === "published" ? false : true);
  const router = useRouter();

  return (
    <button
      className="px-2 py-1.5 bg-accent text-pretty hover:bg-accent-foreground hover:text-background rounded-md text-sm"
      onClick={async () => {
        const res = await publishOrUnpublishProduct(id, state);
        if (res.success) {
          setState("published" === res.data.status ? false : true);
          router.refresh();
          revalidatePathSSR("/dashboard/products");
        }
      }}
    >
      {status === "published" ? "Unpublish" : "Publish"}
    </button>
  );
};

export default PublishButton;
