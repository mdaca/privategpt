import { VectorstoreUpload } from "@/features/vectorstore/upload-vectorstore-ui";

export default async function Home({ params }: { params: { storeid: string } }) {
  return <VectorstoreUpload storeId={params.storeid} />;
}
