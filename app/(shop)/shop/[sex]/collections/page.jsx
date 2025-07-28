const CollectionsPage = async ({ params, searchParams }) => {
  const design = (await searchParams).design || "";
  const designParts = design.split(" ");
  console.log(`COMING FROM /collections/`, await params);
  return (
    <div>
      <p>Coming from /collections/</p>
      <p>Params: {JSON.stringify(await params)}</p>
      <p>Search Params: {JSON.stringify(designParts)}</p>
    </div>
  );
};

export default CollectionsPage;
